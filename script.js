let questions = [];
let hiraganaToKanji = {};

let currentQuestionIndex = 0;
let gameQuestions = [];
let questionsLoaded = false;
let startTime = 0;
let totalTime = 0;
let questionStartTime = 0;
let gameStarted = false;
let timerInterval = null;
let isProcessing = false;
let questionTimer = null;
let correctCount = 0;

// DOM要素は関数内で取得（初期化後に取得）
let userConvertedEl, userInputEl, submitBtnEl, expectedAnswerEl, feedbackEl;
let currentQuestionEl, progressFillEl, gameOverEl, gameAreaEl, startScreenEl;
let startBtnEl, resetBtnEl, retireBtnEl, rankingPreviewEl, gameTimerEl;

// いい感じ変換デモ関連の要素（後で初期化）
let tryConversionBtn, conversionDemoEl, closeDemoBtnEl, backToGameBtnEl;
let sectionBtns, demoSections, textareas;
let currentSection = 'english';
let currentTextarea;

// プロンプトウィンドウ関連の要素（後で初期化）
let conversionPromptWindowEl, closePromptBtnEl, selectedTextDisplayEl;
let conversionPromptEl, conversionResultDisplayEl, executeConversionBtnEl;
let applyConversionBtnEl, cancelConversionBtnEl, promptExampleBtns;

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function loadQuestionsFromJSON() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questions = data.questions.map(q => ({
            context: q.context,
            answer: q.hiragana,
            fullDisplay: q.kanji
        }));
        hiraganaToKanji = data.conversionRules;
        questionsLoaded = true;
    } catch (error) {
        console.error('問題データの読み込みに失敗しました:', error);
        alert('問題データの読み込みに失敗しました。');
    }
}

async function initGame() {
    if (!questionsLoaded) {
        await loadQuestionsFromJSON();
    }
    
    displayRankingPreview();
}

function showUIInstructions() {
    const uiInstructionsEl = document.getElementById('uiInstructions');
    if (uiInstructionsEl) {
        uiInstructionsEl.style.display = 'flex';
    }
}

function hideUIInstructions() {
    const uiInstructionsEl = document.getElementById('uiInstructions');
    if (uiInstructionsEl) {
        uiInstructionsEl.style.display = 'none';
    }
}

function startCountdown() {
    hideUIInstructions();
    const countdownScreenEl = document.getElementById('countdownScreen');
    const countdownNumberEl = document.getElementById('countdownNumber');
    
    if (countdownScreenEl) {
        countdownScreenEl.style.display = 'flex';
    }
    
    let count = 3;
    
    const countdownInterval = setInterval(() => {
        if (countdownNumberEl) {
            countdownNumberEl.textContent = count;
            countdownNumberEl.style.animation = 'none';
            setTimeout(() => {
                countdownNumberEl.style.animation = 'countdownPulse 1s ease-in-out';
            }, 10);
        }
        
        count--;
        
        if (count < 0) {
            clearInterval(countdownInterval);
            if (countdownScreenEl) {
                countdownScreenEl.style.display = 'none';
            }
            actuallyStartGame();
        }
    }, 1000);
}

async function actuallyStartGame() {
    console.log('actuallyStartGame called');
    console.log('questionsLoaded:', questionsLoaded);
    console.log('questions length:', questions.length);
    
    // 問題データが読み込まれていない場合は読み込む
    if (!questionsLoaded || questions.length === 0) {
        console.log('Loading questions...');
        await loadQuestionsFromJSON();
    }
    
    if (questions.length === 0) {
        console.error('No questions available');
        alert('問題データの読み込みに失敗しました。');
        return;
    }
    
    const selectedQuestions = questions.length > 10 
        ? shuffleArray(questions).slice(0, 10)
        : shuffleArray(questions);
    
    gameQuestions = selectedQuestions;
    currentQuestionIndex = 0;
    correctCount = 0;
    totalTime = 0;
    startTime = Date.now();
    gameStarted = true;
    
    console.log('Game starting with', gameQuestions.length, 'questions');
    
    // スコアコレクションをクリア
    document.getElementById('sushiCollection').innerHTML = '';
    
    // スコアカウントをリセット
    const sushiCountEl = document.getElementById('sushiCount');
    if (sushiCountEl) {
        sushiCountEl.textContent = '0';
    }
    
    startScreenEl.style.display = 'none';
    gameAreaEl.style.display = 'block';
    gameOverEl.classList.remove('show');
    
    // ヘッダーを非表示
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.style.display = 'none';
    }
    
    startTimer();
    loadQuestion();
}

// 元のstartGame関数を変更してUI説明画面を表示
async function startGame() {
    // 問題データの事前読み込み
    if (!questionsLoaded || questions.length === 0) {
        await loadQuestionsFromJSON();
    }
    
    if (questions.length === 0) {
        alert('問題データの読み込みに失敗しました。');
        return;
    }
    
    showUIInstructions();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (gameStarted) {
            const elapsed = (Date.now() - startTime) / 1000;
            gameTimerEl.textContent = elapsed.toFixed(1) + '秒';
        }
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetGame() {
    gameStarted = false;
    stopTimer();
    if (questionTimer) {
        clearInterval(questionTimer);
    }
    // 収集したスコアをクリア
    document.getElementById('sushiCollection').innerHTML = '';
    
    // スコアカウントをリセット
    const sushiCountEl = document.getElementById('sushiCount');
    if (sushiCountEl) {
        sushiCountEl.textContent = '0';
    }
    
    // 変数もリセット
    correctCount = 0;
    currentQuestionIndex = 0;
    
    // ヘッダーを再表示
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.style.display = 'block';
    }
    
    startScreenEl.style.display = 'block';
    gameAreaEl.style.display = 'none';
    gameOverEl.classList.remove('show');
    
    if (gameTimerEl) {
        gameTimerEl.textContent = '0.0';
    }
    
    displayRankingPreview();
}

function retireGame() {
    if (!gameStarted) return;
    
    if (confirm('ゲームをリタイアしますか？（スコアは0点になります）')) {
        gameStarted = false;
        stopTimer();
        
        if (questionTimer) {
            clearInterval(questionTimer);
        }
        
        // 結果を表示（スコア0点、正解数は現在までの数、経過時間は現在までの時間）
        const currentTime = gameStarted ? 0 : (Date.now() - startTime) / 1000;
        
        // ランキングに保存（スコア0点）
        saveRanking(0, correctCount, currentTime);
        
        // 結果表示（スコア0点）
        displayResult(0, correctCount, currentTime);
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= gameQuestions.length) {
        endGame();
        return;
    }

    isProcessing = false;
    
    const question = gameQuestions[currentQuestionIndex];
    userInputEl.value = question.context;
    expectedAnswerEl.textContent = question.fullDisplay;
    
    // フリガナを表示
    const targetReadingEl = document.getElementById('targetReading');
    if (targetReadingEl) {
        targetReadingEl.textContent = question.answer;
    }
    
    userConvertedEl.innerHTML = '-';
    
    // azooKeyの優位性を示すヒントを表示
    showAzooKeyHint(currentQuestionIndex);
    
    addSushiToConveyor();
    startQuestionTimer();
    
    questionStartTime = Date.now();
    
    userInputEl.blur();
    
    setTimeout(() => {
        const cursorPosition = question.context.length;
        userInputEl.setSelectionRange(cursorPosition, cursorPosition);
        userInputEl.focus();
    }, 50);
    
    currentQuestionEl.textContent = currentQuestionIndex;
    progressFillEl.style.width = `${((currentQuestionIndex) / gameQuestions.length) * 100}%`;
    
    feedbackEl.classList.remove('show', 'correct', 'incorrect');
}

function showAzooKeyHint(questionIndex) {
    const hints = [
        "💡 文脈を理解して自動変換！確定ボタンは不要です",
        "🚀 一気に最後まで入力すると精度が向上します",
        "🧠 azooKeyは文章全体を見て最適な変換を選択",
        "⚡ ライブ変換で思考を止めずに入力続行",
        "🎯 長い文章ほどazooKeyの文脈理解が活躍",
        "🔥 従来IMEでは困難な複雑変換もお任せ",
        "💪 確定の手間なし、ストレスフリーな入力体験",
        "✨ 文脈で同音異義語を正確に判別",
        "🌟 最後まで入力してからEnterで一括変換",
        "🎊 azooKeyの真髄、ライブ変換を体感中！"
    ];
    
    const hintText = hints[questionIndex % hints.length];
    
    // ヒント表示エリアを探すか作成
    let hintEl = document.getElementById('azookey-hint');
    if (!hintEl) {
        hintEl = document.createElement('div');
        hintEl.id = 'azookey-hint';
        hintEl.className = 'azookey-hint';
        
        // ゲームエリア内の適切な場所に追加
        const questionAreaEl = document.querySelector('.question-area');
        if (questionAreaEl) {
            questionAreaEl.insertBefore(hintEl, questionAreaEl.firstChild);
        }
    }
    
    hintEl.textContent = hintText;
    hintEl.classList.add('show');
    
    // 3秒後にフェードアウト
    setTimeout(() => {
        hintEl.classList.remove('show');
    }, 3000);
}


function addSushiToConveyor() {
    const sushiItemEl = document.getElementById('sushiItem');
    const sushiTypes = ['🍣', '🍤', '🐟', '🐠', '🐡', '🦐', '🦑', '🐙'];
    
    const sushiPlate = document.createElement('div');
    sushiPlate.className = 'sushi-plate';
    
    const sushi = document.createElement('div');
    sushi.className = 'sushi';
    sushi.textContent = sushiTypes[Math.floor(Math.random() * sushiTypes.length)];
    
    const plate = document.createElement('div');
    plate.className = 'plate';
    
    sushiPlate.appendChild(sushi);
    sushiPlate.appendChild(plate);
    
    // 既存の寿司要素をクリア
    const existingPlate = sushiItemEl.querySelector('.sushi-plate');
    if (existingPlate) {
        existingPlate.remove();
    }
    sushiItemEl.appendChild(sushiPlate);
    
    // アニメーションをリセット
    sushiItemEl.style.animation = 'none';
    setTimeout(() => {
        sushiItemEl.style.animation = 'sushi-flow 8s linear';
    }, 10);
}

function startQuestionTimer() {
    if (questionTimer) {
        clearInterval(questionTimer);
    }
    
    let elapsed = 0;
    
    questionTimer = setInterval(() => {
        elapsed += 100;
        
        if (elapsed >= 8000) {
            clearInterval(questionTimer);
            if (!isProcessing) {
                skipQuestion();
            }
        }
    }, 100);
}

function skipQuestion() {
    console.log('skipQuestion呼び出し, isProcessing:', isProcessing);
    if (isProcessing) return;
    isProcessing = true;
    
    console.log('時間切れ処理開始');
    showFeedback('😢 時間切れです...', 'incorrect');
    
    setTimeout(() => {
        console.log('時間切れ後次の問題へ');
        currentQuestionIndex++;
        loadQuestion();
        isProcessing = false;
    }, 1000);
}

function convertToKanji(hiragana, context) {
    if (hiraganaToKanji[hiragana] && hiraganaToKanji[hiragana][context]) {
        return hiraganaToKanji[hiragana][context];
    }
    return hiragana;
}

// いい感じ変換デモの状態管理
let currentSelectedText = '';
let selectionStart = 0;
let selectionEnd = 0;

// デモ画面の表示/非表示
function showConversionDemo() {
    conversionDemoEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    showSection('english'); // デフォルトでEnglishセクションを表示
    currentTextarea.focus();
}

function hideConversionDemo() {
    conversionDemoEl.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 全てのテキストエリアをリセット
    Object.values(textareas).forEach(textarea => {
        updateSelectionDisplayForTextarea(textarea);
    });
    
    // ゲーム終了後からデモに来た場合は結果画面に戻る
    if (gameOverEl.innerHTML && !gameStarted) {
        gameOverEl.classList.add('show');
    }
}

// セクション切り替え
function showSection(sectionName) {
    // セクションボタンの状態更新
    sectionBtns.forEach(btn => {
        if (btn.getAttribute('data-section') === sectionName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // セクションの表示切り替え
    demoSections.forEach(section => {
        if (section.id === sectionName + 'Section') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    // 現在のセクションとテキストエリアを更新
    currentSection = sectionName;
    currentTextarea = textareas[sectionName];
    
    // 選択状態を更新
    updateSelectionDisplayForTextarea(currentTextarea);
}

// プロンプトウィンドウの表示/非表示
function showPromptWindow() {
    if (currentSelectedText) {
        selectedTextDisplayEl.textContent = currentSelectedText;
        conversionPromptWindowEl.style.display = 'flex';
        conversionPromptEl.focus();
    }
}

function hidePromptWindow() {
    conversionPromptWindowEl.style.display = 'none';
    conversionPromptEl.value = '';
}

// テキスト選択状態の更新（特定のテキストエリア用）
function updateSelectionDisplayForTextarea(textarea) {
    const selectionDisplay = textarea.parentElement.querySelector('.selection-display');
    const convertBtn = textarea.parentElement.querySelector('.convert-btn');
    
    const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selection.length > 0) {
        selectionDisplay.textContent = `選択されたテキスト: "${selection}"`;
        convertBtn.disabled = false;
        
        // 現在のテキストエリアの場合は、グローバル状態も更新
        if (textarea === currentTextarea) {
            currentSelectedText = selection;
            selectionStart = textarea.selectionStart;
            selectionEnd = textarea.selectionEnd;
        }
    } else {
        selectionDisplay.textContent = '選択されたテキスト: なし';
        convertBtn.disabled = true;
        
        if (textarea === currentTextarea) {
            currentSelectedText = '';
        }
    }
}

function checkAnswer() {
    if (!gameStarted || isProcessing) return;
    
    isProcessing = true;
    
    const fullText = userInputEl.value;
    const question = gameQuestions[currentQuestionIndex];
    
    console.log('入力:', fullText);
    console.log('期待:', question.fullDisplay);
    
    updateComparisonDisplay(fullText, question.fullDisplay);
    
    const normalizedInput = fullText.replace(/\s+/g, '');
    const normalizedExpected = question.fullDisplay.replace(/\s+/g, '');
    
    console.log('正規化入力:', normalizedInput);
    console.log('正規化期待:', normalizedExpected);
    
    const isCorrect = normalizedInput === normalizedExpected;
    
    console.log('正解判定:', isCorrect);
    
    if (isCorrect) {
        console.log('正解処理開始');
        correctCount++;
        clearInterval(questionTimer);
        showFeedback('🍣 ごちそうさま！', 'correct');
        collectSushi();
        setTimeout(() => {
            console.log('次の問題へ移行');
            currentQuestionIndex++;
            loadQuestion();
            isProcessing = false;
        }, 1000);
    } else {
        userInputEl.focus();
        isProcessing = false;
    }
}

function collectSushi() {
    const sushiItemEl = document.getElementById('sushiItem');
    const sushiCollection = document.getElementById('sushiCollection');
    const sushiCountEl = document.getElementById('sushiCount');
    const sushiPlate = sushiItemEl.querySelector('.sushi-plate');
    
    if (sushiPlate) {
        const sushiEmoji = sushiPlate.querySelector('.sushi').textContent;
        const collectedPlate = document.createElement('div');
        collectedPlate.className = 'collected-plate';
        collectedPlate.textContent = sushiEmoji;
        
        // Flexboxで自然に横並びにする（位置指定不要）
        
        sushiCollection.appendChild(collectedPlate);
        
        // スコアカウントを更新
        if (sushiCountEl) {
            sushiCountEl.textContent = correctCount;
        }
        
        // 寿司アイテムをクリア
        sushiItemEl.style.animation = 'none';
        const existingPlateEl = sushiItemEl.querySelector('.sushi-plate');
        if (existingPlateEl) {
            existingPlateEl.remove();
        }
    }
}

function containsKanji(text) {
    // 漢字が含まれているかチェック（ひらがな・カタカナ・英数字・記号以外）
    return /[^\u3040-\u309F\u30A0-\u30FF\u0020-\u007E\uFF01-\uFF5E]/.test(text);
}

function removeKanji(text) {
    // 漢字を削除してひらがなのみに戻す
    return text.replace(/[^\u3040-\u309F]/g, '');
}

function updateComparisonDisplay(userConverted, expected) {
    // 冒頭から一致している部分を見つける
    let matchLength = 0;
    const minLength = Math.min(userConverted.length, expected.length);
    
    for (let i = 0; i < minLength; i++) {
        if (userConverted[i] === expected[i]) {
            matchLength++;
        } else {
            break;
        }
    }
    
    let expectedHTML = '';
    if (matchLength > 0) {
        expectedHTML += `<span class="match">${expected.substring(0, matchLength)}</span>`;
    }
    if (matchLength < expected.length) {
        expectedHTML += `<span class="no-match">${expected.substring(matchLength)}</span>`;
    }
    
    let convertedHTML = '';
    if (matchLength > 0) {
        convertedHTML += `<span class="match">${userConverted.substring(0, matchLength)}</span>`;
    }
    if (matchLength < userConverted.length) {
        convertedHTML += `<span class="no-match">${userConverted.substring(matchLength)}</span>`;
    }
    
    expectedAnswerEl.innerHTML = expectedHTML;
    userConvertedEl.innerHTML = convertedHTML;
}

function showFeedback(message, type) {
    feedbackEl.textContent = message;
    feedbackEl.classList.add('show', type);
}

function endGame() {
    gameStarted = false;
    stopTimer();
    if (questionTimer) {
        clearInterval(questionTimer);
    }
    totalTime = (Date.now() - startTime) / 1000;
    
    document.activeElement.blur();
    
    const finalScore = Math.max(0, 100 - totalTime + correctCount * 10);
    saveRanking(finalScore, correctCount, totalTime);
    displayResult(finalScore, correctCount, totalTime);
}

function saveRanking(score, correct, time) {
    const rankings = getRankings();
    const now = new Date();
    const newEntry = {
        id: Date.now() + Math.random(),
        name: '無名' + Math.floor(Math.random() * 1000),
        score: score.toFixed(2),
        correct: correct,
        time: time.toFixed(2),
        date: now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    rankings.push(newEntry);
    rankings.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    rankings.splice(10);
    
    // 今日獲得したスコア数を更新
    updateDailySushiCount(correct);
    
    try {
        localStorage.setItem('typingGameRankings', JSON.stringify(rankings));
        localStorage.setItem('typingGameLastEntry', JSON.stringify(newEntry));
    } catch (error) {
        console.error('LocalStorageへの保存に失敗しました:', error);
    }
}

function updateDailySushiCount(count) {
    const today = new Date().toDateString();
    const dailyDataKey = 'typingGameDailyData';
    let dailyData = JSON.parse(localStorage.getItem(dailyDataKey) || '{}');
    
    if (!dailyData[today]) {
        dailyData[today] = { totalSushi: 0 };
    }
    
    dailyData[today].totalSushi += count;
    
    try {
        localStorage.setItem(dailyDataKey, JSON.stringify(dailyData));
    } catch (error) {
        console.error('日次データの保存に失敗しました:', error);
    }
}

function getDailySushiCount() {
    const today = new Date().toDateString();
    const dailyData = JSON.parse(localStorage.getItem('typingGameDailyData') || '{}');
    return dailyData[today]?.totalSushi || 0;
}

function displayResult(score, correct, time) {
    gameAreaEl.style.display = 'none';
    gameOverEl.classList.add('show');
    
    // ヘッダーは結果画面では非表示のまま
    
    const lastEntry = JSON.parse(localStorage.getItem('typingGameLastEntry') || '{}');
    
    const rankingDisplayHTML = `
        <div class="result-container">
            <div class="result-header">
                <div class="completion-badge">
                    <div class="badge-icon">🎉</div>
                    <h2 class="completion-title">ゲームクリア！</h2>
                    <p class="completion-subtitle">お疲れさまでした</p>
                </div>
            </div>
            
            <div class="result-content">
                <div class="score-section">
                    <div class="main-score-card">
                        <div class="score-header">
                            <h3>🍣 あなたの結果</h3>
                        </div>
                        <div class="score-display">
                            <div class="score-value">${score.toFixed(2)}</div>
                            <div class="score-unit">点</div>
                        </div>
                        <div class="score-breakdown">
                            <div class="breakdown-item">
                                <span class="breakdown-icon">🍣</span>
                                <span class="breakdown-label">正解問題数</span>
                                <span class="breakdown-value">${correct}問</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-icon">⏱️</span>
                                <span class="breakdown-label">クリア時間</span>
                                <span class="breakdown-value">${time.toFixed(2)}秒</span>
                            </div>
                        </div>
                        <div class="score-formula">
                            <p>スコア計算: 100 - タイム + (正解数 × 10)</p>
                        </div>
                    </div>
                </div>

                <div class="ranking-section">
                    <div class="ranking-header">
                        <h3>🏆 本日のランキング</h3>
                        <p class="ranking-subtitle">毎日0時にリセットされます</p>
                    </div>
                    
                    <div class="name-registration">
                        <h4>ランキングに登録</h4>
                        <div class="name-input-group">
                            <input type="text" id="playerName" value="${lastEntry.name || ''}" placeholder="お名前を入力してください" maxlength="20">
                            <button id="updateNameBtn" class="register-btn">登録</button>
                        </div>
                    </div>
                    
                    <div class="ranking-list" id="rankingList"></div>
                </div>

                <div class="next-experience-section">
                    <div class="tour-divider">
                        <div class="divider-line"></div>
                        <div class="divider-text">🎯 次の体験</div>
                        <div class="divider-line"></div>
                    </div>
                    
                    <div class="next-feature-card">
                        <div class="feature-header">
                            <div class="feature-badge">NEXT STEP</div>
                            <h4>🤖 いい感じ変換を体験しよう</h4>
                            <p class="feature-subtitle">LLMと接続した賢い変換機能</p>
                        </div>
                        
                        <div class="feature-showcase">
                            <div class="showcase-grid">
                                <div class="showcase-item">
                                    <div class="showcase-icon">🎭</div>
                                    <h5>文脈を理解したいい感じ変換</h5>
                                    <p class="showcase-example">「えもじ」Ctrl+S → 文脈に合った絵文字・記号</p>
                                </div>
                                <div class="showcase-item">
                                    <div class="showcase-icon">✨</div>
                                    <h5>AI文章補完</h5>
                                    <p class="showcase-example">Ctrl+S → 文章の続きを自動生成</p>
                                </div>
                                <div class="showcase-item">
                                    <div class="showcase-icon">🔄</div>
                                    <h5>選択範囲変換</h5>
                                    <p class="showcase-example">選択してCtrl+S→「English」で翻訳</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="feature-demo-examples">
                            <h5>💡 体験できる変換例</h5>
                            <div class="demo-examples-grid">
                                <div class="demo-example">
                                    <span class="example-before">中華料理はおいしい「えもじ」</span>
                                    <span class="example-prompt">Ctrl+S</span>
                                    <span class="example-after">→ 🥡🥟🍜</span>
                                </div>
                                <div class="demo-example">
                                    <span class="example-before">母の日の花といえば</span>
                                    <span class="example-prompt">Ctrl+S</span>
                                    <span class="example-after">→ カーネーションが定番ですね。</span>
                                </div>
                                <div class="demo-example">
                                    <span class="example-before">【私は直希です。よろしく】</span>
                                    <span class="example-prompt">Ctrl+S→English</span>
                                    <span class="example-after">→ I am Naoki. Nice to meet you.</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cta-section">
                            <a href="good-feeling-conversion.html" class="next-experience-btn">
                                <span class="btn-icon">🚀</span>
                                <span class="btn-text">いい感じ変換を体験する</span>
                                <span class="btn-arrow">→</span>
                            </a>
                            <p class="cta-note">所要時間: 約3分</p>
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <button id="restartBtn" class="action-btn primary">もう一度プレイ</button>
                    <a href="https://zenn.dev/azookey/articles/ea15bacf81521e" target="_blank" class="action-btn secondary">
                        azooKey on macOSをダウンロード
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // 既存の要素をクリア
    gameOverEl.innerHTML = '';
    
    gameOverEl.insertAdjacentHTML('beforeend', rankingDisplayHTML);
    
    // イベントリスナーを追加
    const updateBtn = document.getElementById('updateNameBtn');
    const nameInput = document.getElementById('playerName');
    const restartBtn = document.getElementById('restartBtn');
    
    updateBtn.addEventListener('click', () => updatePlayerName());
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updatePlayerName();
    });
    restartBtn.addEventListener('click', resetGame);
    
    displayRankings();
}

function updatePlayerName() {
    const nameInput = document.getElementById('playerName');
    const newName = nameInput.value.trim();
    
    if (!newName) {
        alert('名前を入力してください');
        return;
    }
    
    const lastEntry = JSON.parse(localStorage.getItem('typingGameLastEntry') || '{}');
    if (!lastEntry.id) return;
    
    const rankings = getRankings();
    const entryIndex = rankings.findIndex(entry => entry.id === lastEntry.id);
    
    if (entryIndex !== -1) {
        rankings[entryIndex].name = newName;
        lastEntry.name = newName;
        
        try {
            localStorage.setItem('typingGameRankings', JSON.stringify(rankings));
            localStorage.setItem('typingGameLastEntry', JSON.stringify(lastEntry));
            displayRankings();
        } catch (error) {
            console.error('LocalStorageへの保存に失敗しました:', error);
        }
    }
}

function getRankings() {
    // 1日でリセットするランキング取得
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('typingGameLastReset');
    
    if (lastResetDate !== today) {
        // 新しい日になったのでランキングをリセット
        localStorage.setItem('typingGameRankings', JSON.stringify([]));
        localStorage.setItem('typingGameLastReset', today);
        localStorage.removeItem('typingGameLastEntry');
        return [];
    }
    
    return JSON.parse(localStorage.getItem('typingGameRankings') || '[]');
}

function displayRankings() {
    const rankings = getRankings();
    const rankingList = document.getElementById('rankingList');
    
    if (!rankingList) return;
    
    if (rankings.length === 0) {
        rankingList.innerHTML = '<div class="no-rankings"><p>🎌 まだランキングがありません</p><p>あなたが今日の1番乗りです！</p></div>';
        return;
    }
    
    let html = '<div class="ranking-list-container"><ol class="rankings">';
    rankings.forEach((entry, index) => {
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}位`;
        
        html += `
            <li class="ranking-entry ${rankClass}">
                <div class="rank-medal">${medal}</div>
                <div class="entry-details">
                    <div class="player-info">
                        <span class="player-name">${entry.name}</span>
                        <span class="player-score">${entry.score}点</span>
                    </div>
                    <div class="game-stats">
                        <span class="stat-item">🍣 ${entry.correct}問正解</span>
                        <span class="stat-item">⏱️ ${entry.time}秒</span>
                    </div>
                    <div class="entry-date">${entry.date}</div>
                </div>
            </li>
        `;
    });
    html += '</ol></div>';
    
    rankingList.innerHTML = html;
}


function displayRankingPreview() {
    const rankings = getRankings();
    
    if (rankings.length === 0) {
        if (rankingPreviewEl) {
            rankingPreviewEl.innerHTML = '';
        }
        return;
    }
    
    let html = '<h3>ランキング TOP10</h3><ol class="rankings-preview">';
    rankings.forEach((entry, index) => {
        html += `
            <li class="ranking-entry">
                <span class="rank">${index + 1}位</span>
                <div class="entry-details">
                    <div class="name-time">
                        <span class="name">${entry.name}</span>
                        <span class="score">スコア: ${entry.score}点</span>
                    </div>
                    <div class="stats">🍣${entry.correct}貫 | ⏱${entry.time}秒</div>
                    <div class="date">${entry.date}</div>
                </div>
            </li>
        `;
    });
    html += '</ol>';
    
    if (rankingPreviewEl) {
        rankingPreviewEl.innerHTML = html;
    }
}

// ツアー機能
function startTypingDemo() {
    // azookeyショーケースを非表示にしてゲーム画面に移行
    const showcaseEl = document.getElementById('azookeyShowcase');
    const startScreenEl = document.getElementById('startScreen');
    
    if (showcaseEl) {
        showcaseEl.style.display = 'none';
    }
    startScreenEl.style.display = 'block';
    
    // スムーズスクロール
    startScreenEl.scrollIntoView({ behavior: 'smooth' });
}

// windowオブジェクトに関数を追加
window.showConversionDemo = showConversionDemo;
window.startTypingDemo = startTypingDemo;

// ページ読み込み時にショーケースを表示、ゲーム画面を非表示
function initializePage() {
    const showcaseEl = document.getElementById('azookeyShowcase');
    const startScreenEl = document.getElementById('startScreen');
    
    // 初回訪問かどうかをチェック
    const hasVisited = localStorage.getItem('azookey_visited');
    
    if (!hasVisited) {
        // 初回訪問時のみショーケースを表示
        if (showcaseEl) {
            showcaseEl.style.display = 'block';
        }
        if (startScreenEl) {
            startScreenEl.style.display = 'none';
        }
        localStorage.setItem('azookey_visited', 'true');
    } else {
        // 既訪問時はショーケースをスキップしてゲーム画面を表示
        if (showcaseEl) {
            showcaseEl.style.display = 'none';
        }
        if (startScreenEl) {
            startScreenEl.style.display = 'block';
        }
    }
}

// DOM要素を初期化する関数
function initializeElements() {
    // 基本的なゲーム要素
    userConvertedEl = document.getElementById('userConverted');
    userInputEl = document.getElementById('userInput');
    submitBtnEl = document.getElementById('submitBtn');
    expectedAnswerEl = document.getElementById('expectedAnswer');
    feedbackEl = document.getElementById('feedback');
    currentQuestionEl = document.getElementById('currentQuestion');
    progressFillEl = document.getElementById('progressFill');
    gameOverEl = document.getElementById('gameOver');
    gameAreaEl = document.querySelector('.game-area');
    startScreenEl = document.getElementById('startScreen');
    startBtnEl = document.getElementById('startBtn');
    resetBtnEl = document.getElementById('resetBtn');
    retireBtnEl = document.getElementById('retireBtn');
    rankingPreviewEl = document.getElementById('rankingPreview');
    gameTimerEl = document.getElementById('gameTimer');

    // いい感じ変換デモ関連の要素
    tryConversionBtn = document.getElementById('tryConversionBtn');
    conversionDemoEl = document.getElementById('conversionDemo');
    closeDemoBtnEl = document.getElementById('closeDemoBtn');
    backToGameBtnEl = document.getElementById('backToGameBtn');
    sectionBtns = document.querySelectorAll('.section-btn');
    demoSections = document.querySelectorAll('.demo-section');
    
    textareas = {
        english: document.getElementById('englishTextarea'),
        emoji: document.getElementById('emojiTextarea'),
        business: document.getElementById('businessTextarea'),
        casual: document.getElementById('casualTextarea'),
        formal: document.getElementById('formalTextarea'),
        'context-emoji': document.getElementById('contextEmojiTextarea'),
        completion: document.getElementById('completionTextarea')
    };
    
    if (textareas.english) {
        currentTextarea = textareas.english;
    }

    // プロンプトウィンドウ関連の要素
    conversionPromptWindowEl = document.getElementById('conversionPromptWindow');
    closePromptBtnEl = document.getElementById('closePromptBtn');
    selectedTextDisplayEl = document.getElementById('selectedTextDisplay');
    conversionPromptEl = document.getElementById('conversionPrompt');
    conversionResultDisplayEl = document.getElementById('conversionResultDisplay');
    executeConversionBtnEl = document.getElementById('executeConversionBtn');
    applyConversionBtnEl = document.getElementById('applyConversionBtn');
    cancelConversionBtnEl = document.getElementById('cancelConversionBtn');
    promptExampleBtns = document.querySelectorAll('.prompt-example-btn');
    
    // イベントリスナーを設定
    setupEventListeners();
}

// イベントリスナーを設定する関数
function setupEventListeners() {
    // 基本的なゲームイベント
    if (userInputEl) {
        userInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        });

        userInputEl.addEventListener('input', (e) => {
            const text = e.target.value;
            
            if (!gameStarted || currentQuestionIndex >= gameQuestions.length) return;
            
            const question = gameQuestions[currentQuestionIndex];
            
            // 入力中のリアルタイム表示（入力方法に関係なく結果を表示）
            const userAnswer = text.replace(question.context, '').trim();
            if (userAnswer) {
                updateComparisonDisplay(text, question.fullDisplay);
            } else {
                userConvertedEl.innerHTML = '-';
                expectedAnswerEl.textContent = question.fullDisplay;
            }
        });
    }
    
    if (startBtnEl) {
        startBtnEl.addEventListener('click', startGame);
    }
    
    // UI説明画面のカウントダウン開始ボタン
    const startCountdownBtnEl = document.getElementById('startCountdownBtn');
    if (startCountdownBtnEl) {
        startCountdownBtnEl.addEventListener('click', startCountdown);
    }
    
    if (resetBtnEl) {
        resetBtnEl.addEventListener('click', resetGame);
    }
    
    if (retireBtnEl) {
        retireBtnEl.addEventListener('click', retireGame);
    }

    // いい感じ変換デモのイベントリスナー
    if (tryConversionBtn) {
        tryConversionBtn.addEventListener('click', showConversionDemo);
    }
    if (closeDemoBtnEl) {
        closeDemoBtnEl.addEventListener('click', hideConversionDemo);
    }
    if (backToGameBtnEl) {
        backToGameBtnEl.addEventListener('click', hideConversionDemo);
    }

    // プロンプトウィンドウのイベントリスナー
    if (closePromptBtnEl) {
        closePromptBtnEl.addEventListener('click', hidePromptWindow);
    }
    if (cancelConversionBtnEl) {
        cancelConversionBtnEl.addEventListener('click', hidePromptWindow);
    }

    // セクション切り替えボタンのイベントリスナー
    if (sectionBtns) {
        sectionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                showSection(section);
                if (currentTextarea) {
                    currentTextarea.focus();
                }
            });
        });
    }

    // 各テキストエリアにイベントリスナーを追加
    if (textareas) {
        Object.values(textareas).forEach(textarea => {
            if (!textarea) return;
            
            // 選択状態を監視
            textarea.addEventListener('select', () => {
                updateSelectionDisplayForTextarea(textarea);
            });
            
            textarea.addEventListener('mouseup', () => {
                updateSelectionDisplayForTextarea(textarea);
            });
            
            textarea.addEventListener('keyup', () => {
                updateSelectionDisplayForTextarea(textarea);
            });
            
            // Ctrl+S でプロンプトウィンドウを開く
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault(); // ブラウザの保存ダイアログを防ぐ
                    e.stopPropagation();
                    // フォーカスが当たっているテキストエリアを現在のものとして設定
                    currentTextarea = textarea;
                    currentSelectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                    showPromptWindow();
                }
            });
            
            // 変換ボタンにイベントリスナーを追加
            const convertBtn = textarea.parentElement.querySelector('.convert-btn');
            if (convertBtn) {
                convertBtn.addEventListener('click', () => {
                    currentTextarea = textarea;
                    currentSelectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                    showPromptWindow();
                });
            }
        });
    }

    // プロンプト例ボタンのイベントリスナー
    if (promptExampleBtns) {
        promptExampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                if (conversionPromptEl) {
                    conversionPromptEl.value = prompt;
                }
            });
        });
    }

    // デモ画面の背景クリックで閉じる
    if (conversionDemoEl) {
        conversionDemoEl.addEventListener('click', (e) => {
            if (e.target === conversionDemoEl) {
                hideConversionDemo();
            }
        });
    }

    // プロンプトウィンドウの背景クリックで閉じる
    if (conversionPromptWindowEl) {
        conversionPromptWindowEl.addEventListener('click', (e) => {
            if (e.target === conversionPromptWindowEl) {
                hidePromptWindow();
            }
        });
    }
}

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
    // DOM要素を初期化
    initializeElements();
    
    // ページ初期化
    initializePage();
    initGame();
});