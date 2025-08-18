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

const userConvertedEl = document.getElementById('userConverted');
const userInputEl = document.getElementById('userInput');
const submitBtnEl = document.getElementById('submitBtn');
const expectedAnswerEl = document.getElementById('expectedAnswer');
const feedbackEl = document.getElementById('feedback');
const currentQuestionEl = document.getElementById('currentQuestion');
const progressFillEl = document.getElementById('progressFill');
const gameOverEl = document.getElementById('gameOver');
const restartBtnEl = document.getElementById('restartBtn');
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
    totalTime = 0;
    startTime = Date.now();
    gameStarted = true;
    
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

    isProcessing = false; // 新しい問題読み込み時にフラグをリセット
    
    const question = gameQuestions[currentQuestionIndex];
    userInputEl.value = question.context;
    expectedAnswerEl.innerHTML = `<span class="label">期待される結果:</span> ${question.fullDisplay}`;
    userConvertedEl.innerHTML = '-';
    
    questionStartTime = Date.now();
    
    // IMEの文脈読み直しのため、一度フォーカスを外してから再設定
    userInputEl.blur();
    
    setTimeout(() => {
        const cursorPosition = question.context.length;
        userInputEl.setSelectionRange(cursorPosition, cursorPosition);
        userInputEl.focus();
    }, 50); // 50ms後にフォーカスを当てる
    
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    progressFillEl.style.width = `${((currentQuestionIndex + 1) / gameQuestions.length) * 100}%`;
    
    feedbackEl.classList.remove('show', 'correct', 'incorrect');
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
    
    if (!fullText.startsWith(question.context)) {
        showFeedback('文脈を消さないでください', 'incorrect');
        isProcessing = false;
        return;
    }
    
    const userAnswer = fullText.replace(question.context, '').trim();
    
    if (!userAnswer) {
        showFeedback('回答を入力してください', 'incorrect');
        isProcessing = false;
        return;
    }
    
    // 比較表示を更新（入力されたテキストをそのまま使用）
    updateComparisonDisplay(fullText, question.fullDisplay);
    
    // 空白を無視して比較
    const normalizedInput = fullText.replace(/\s+/g, '');
    const normalizedExpected = question.fullDisplay.replace(/\s+/g, '');
    
    // IMEテスト:最終的な結果が正しければ入力方法に関係なく正解
    const isCorrect = normalizedInput === normalizedExpected;
    
    if (isCorrect) {
        showFeedback('正解！次の問題に進みます', 'correct');
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
            isProcessing = false;
        }, 1000);
    } else {
        // 間違いの場合は何もしない（入力を保持）
        userInputEl.focus();
        isProcessing = false;
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
    
    // 期待される結果の表示
    let expectedHTML = '<span class="label">期待される結果:</span> ';
    if (matchLength > 0) {
        expectedHTML += `<span class="match">${expected.substring(0, matchLength)}</span>`;
    }
    if (matchLength < expected.length) {
        expectedHTML += `<span class="no-match">${expected.substring(matchLength)}</span>`;
    }
    
    // あなたの変換結果の表示
    let convertedHTML = '<span class="label">あなたの変換結果:</span> ';
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
    totalTime = Date.now() - startTime;
    gameStarted = false;
    stopTimer();
    gameAreaEl.style.display = 'none';
    gameOverEl.classList.add('show');
    
    // 自動でランキングに登録
    autoSaveRanking();
    showRankingDisplay();
}

function autoSaveRanking() {
    const timeInSeconds = (totalTime / 1000).toFixed(2);
    const defaultName = '無名' + Math.floor(Math.random() * 1000);
    
    const rankings = getRankings();
    const now = new Date();
    const newEntry = {
        id: Date.now() + Math.random(), // 一意なID
        name: defaultName,
        time: parseFloat(timeInSeconds),
        date: now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    };
    
    rankings.push(newEntry);
    rankings.sort((a, b) => a.time - b.time);
    rankings.splice(10);
    
    try {
        localStorage.setItem('typingGameRankings', JSON.stringify(rankings));
        localStorage.setItem('typingGameLastEntry', JSON.stringify(newEntry));
    } catch (error) {
        console.error('LocalStorageへの保存に失敗しました:', error);
    }
}

function showRankingDisplay() {
    const timeInSeconds = (totalTime / 1000).toFixed(2);
    const lastEntry = JSON.parse(localStorage.getItem('typingGameLastEntry') || '{}');
    
    const rankingDisplayHTML = `
        <div class="ranking-display">
            <h3>ゲーム完了！</h3>
            <p class="time-display">完了タイム: ${timeInSeconds}秒</p>
            <div class="name-edit">
                <label>名前: </label>
                <input type="text" id="playerName" value="${lastEntry.name || ''}" maxlength="20">
                <button id="updateNameBtn" class="update-name-btn">名前更新</button>
            </div>
        </div>
        <div class="ranking-list" id="rankingList"></div>
    `;
    
    const existingDisplay = document.querySelector('.ranking-display');
    const existingRankingList = document.querySelector('.ranking-list');
    if (existingDisplay) existingDisplay.remove();
    if (existingRankingList) existingRankingList.remove();
    
    gameOverEl.insertAdjacentHTML('beforeend', rankingDisplayHTML);
    
    const updateBtn = document.getElementById('updateNameBtn');
    const nameInput = document.getElementById('playerName');
    
    updateBtn.addEventListener('click', () => updatePlayerName());
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updatePlayerName();
    });
    
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
                        <span class="time">${entry.time}秒</span>
                    </div>
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
    
    if (!text.startsWith(question.context)) {
        e.target.value = question.context;
        const cursorPosition = question.context.length;
        e.target.setSelectionRange(cursorPosition, cursorPosition);
        return;
    }
    
    // 入力中のリアルタイム表示（入力方法に関係なく結果を表示）
    const userAnswer = text.replace(question.context, '').trim();
    if (userAnswer) {
        updateComparisonDisplay(text, question.fullDisplay);
    } else {
        userConvertedEl.innerHTML = '-';
        expectedAnswerEl.innerHTML = `<span class="label">期待される結果:</span> ${question.fullDisplay}`;
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
                        <span class="time">${entry.time}秒</span>
                    </div>
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
restartBtnEl.addEventListener('click', resetGame);

initGame();