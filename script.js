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

const userConvertedEl = document.getElementById('userConverted');
const userInputEl = document.getElementById('userInput');
const submitBtnEl = document.getElementById('submitBtn');
const expectedAnswerEl = document.getElementById('expectedAnswer');
const feedbackEl = document.getElementById('feedback');
const currentQuestionEl = document.getElementById('currentQuestion');
const progressFillEl = document.getElementById('progressFill');
const gameOverEl = document.getElementById('gameOver');
const gameAreaEl = document.querySelector('.game-area');
const startScreenEl = document.getElementById('startScreen');
const startBtnEl = document.getElementById('startBtn');
const resetBtnEl = document.getElementById('resetBtn');
const rankingPreviewEl = document.getElementById('rankingPreview');
const gameTimerEl = document.getElementById('gameTimer');

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
            fullDisplay: q.context + q.kanji
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

async function startGame() {
    const selectedQuestions = questions.length > 10 
        ? shuffleArray(questions).slice(0, 10)
        : shuffleArray(questions);
    
    gameQuestions = selectedQuestions;
    currentQuestionIndex = 0;
    correctCount = 0;
    totalTime = 0;
    startTime = Date.now();
    gameStarted = true;
    
    // 寿司コレクションをクリア
    document.getElementById('sushiCollection').innerHTML = '';
    
    // 寿司カウントをリセット
    const sushiCountEl = document.getElementById('sushiCount');
    if (sushiCountEl) {
        sushiCountEl.textContent = '0';
    }
    
    startScreenEl.style.display = 'none';
    gameAreaEl.style.display = 'block';
    gameOverEl.classList.remove('show');
    
    startTimer();
    loadQuestion();
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
    // 収集した寿司をクリア
    document.getElementById('sushiCollection').innerHTML = '';
    
    // 寿司カウントをリセット
    const sushiCountEl = document.getElementById('sushiCount');
    if (sushiCountEl) {
        sushiCountEl.textContent = '0';
    }
    
    // 変数もリセット
    correctCount = 0;
    currentQuestionIndex = 0;
    
    startScreenEl.style.display = 'block';
    gameAreaEl.style.display = 'none';
    gameOverEl.classList.remove('show');
    displayRankingPreview();
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
    
    userConvertedEl.innerHTML = '<span class="result-label">入力結果:</span> -';
    
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
    
    sushiItemEl.innerHTML = '';
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
        collectedPlate.style.animationDelay = '0s';
        sushiCollection.appendChild(collectedPlate);
        
        // 寿司カウントを更新
        if (sushiCountEl) {
            sushiCountEl.textContent = correctCount;
        }
        
        sushiItemEl.style.animation = 'none';
        sushiItemEl.innerHTML = '';
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
    
    let convertedHTML = '<span class="result-label">入力結果:</span> ';
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
    
    // 今日食べた寿司数を更新
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
    
    const lastEntry = JSON.parse(localStorage.getItem('typingGameLastEntry') || '{}');
    const dailySushiCount = getDailySushiCount();
    
    const rankingDisplayHTML = `
        <div class="result-container">
            <div class="result-header">
                <div class="completion-badge">
                    <div class="badge-icon">🎉</div>
                    <h2 class="completion-title">お疲れさまでした！</h2>
                    <p class="completion-subtitle">azooKey on macOSの体験はいかがでしたか？</p>
                </div>
            </div>
            
            <div class="result-content">
                <div class="score-section">
                    <div class="main-score-card">
                        <div class="score-header">
                            <h3>あなたのスコア</h3>
                        </div>
                        <div class="score-display">
                            <div class="score-value">${score.toFixed(2)}</div>
                            <div class="score-unit">点</div>
                        </div>
                        <div class="score-breakdown">
                            <div class="breakdown-item">
                                <span class="breakdown-icon">🍣</span>
                                <span class="breakdown-label">取得した寿司</span>
                                <span class="breakdown-value">${correct}貫</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-icon">⏱️</span>
                                <span class="breakdown-label">クリア時間</span>
                                <span class="breakdown-value">${time.toFixed(2)}秒</span>
                            </div>
                        </div>
                        <div class="score-formula">
                            <p>スコア計算式: 100 - タイム + (取得数 × 10)</p>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <div class="daily-stats">
                        <h4>📅 本日の累計</h4>
                        <div class="daily-count">${dailySushiCount}貫の寿司を獲得</div>
                    </div>
                </div>

                <div class="name-registration">
                    <h4>ランキングに登録</h4>
                    <div class="name-input-group">
                        <input type="text" id="playerName" value="${lastEntry.name || ''}" placeholder="お名前を入力してください" maxlength="20">
                        <button id="updateNameBtn" class="register-btn">登録</button>
                    </div>
                </div>

                <div class="actions-section">
                    <button id="restartBtn" class="action-btn primary">もう一度プレイ</button>
                    <a href="https://zenn.dev/azookey/articles/ea15bacf81521e" target="_blank" class="action-btn secondary">
                        azooKey on macOSについて詳しく
                    </a>
                </div>
            </div>
            
            <div class="ranking-section">
                <div class="ranking-list" id="rankingList"></div>
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
        rankingList.innerHTML = '<p class="no-rankings">まだランキングがありません</p>';
        return;
    }
    
    let html = '<h3>ランキング TOP10</h3><ol class="rankings">';
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
    
    rankingList.innerHTML = html;
}


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

function displayRankingPreview() {
    const rankings = getRankings();
    
    if (rankings.length === 0) {
        rankingPreviewEl.innerHTML = '';
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
    
    rankingPreviewEl.innerHTML = html;
}

startBtnEl.addEventListener('click', startGame);
resetBtnEl.addEventListener('click', resetGame);

initGame();