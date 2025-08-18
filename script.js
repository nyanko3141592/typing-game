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

    const question = gameQuestions[currentQuestionIndex];
    userInputEl.value = question.context;
    expectedAnswerEl.textContent = question.fullDisplay;
    userConvertedEl.textContent = '-';
    
    questionStartTime = Date.now();
    
    const cursorPosition = question.context.length;
    userInputEl.setSelectionRange(cursorPosition, cursorPosition);
    userInputEl.focus();
    
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

function checkAnswerRealtime() {
    if (!gameStarted) return;
    
    const fullText = userInputEl.value;
    const question = gameQuestions[currentQuestionIndex];
    
    if (!fullText.startsWith(question.context)) {
        return;
    }
    
    const userAnswer = fullText.replace(question.context, '').trim();
    
    if (!userAnswer) {
        userConvertedEl.textContent = '-';
        feedbackEl.classList.remove('show', 'correct', 'incorrect');
        return;
    }
    
    const convertedAnswer = convertToKanji(userAnswer, question.context);
    const fullConverted = question.context + convertedAnswer;
    
    userConvertedEl.textContent = fullConverted;
    
    const isCorrect = fullConverted === question.fullDisplay;
    
    if (isCorrect) {
        showFeedback('正解！次の問題に進みます', 'correct');
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 800);
    } else {
        if (userAnswer.length > 0) {
            feedbackEl.classList.remove('show', 'correct', 'incorrect');
        }
    }
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
    
    showRankingForm();
}

function showRankingForm() {
    const timeInSeconds = (totalTime / 1000).toFixed(2);
    const rankingFormHTML = `
        <div class="ranking-form">
            <h3>ゲーム完了！</h3>
            <p class="time-display">完了タイム: ${timeInSeconds}秒</p>
            <input type="text" id="playerName" placeholder="名前を入力" maxlength="20">
            <button id="saveRankingBtn" class="save-ranking-btn">ランキングに登録</button>
        </div>
        <div class="ranking-list" id="rankingList"></div>
    `;
    
    const existingRankingForm = document.querySelector('.ranking-form');
    const existingRankingList = document.querySelector('.ranking-list');
    if (existingRankingForm) existingRankingForm.remove();
    if (existingRankingList) existingRankingList.remove();
    
    gameOverEl.insertAdjacentHTML('beforeend', rankingFormHTML);
    
    const saveBtn = document.getElementById('saveRankingBtn');
    const nameInput = document.getElementById('playerName');
    
    saveBtn.addEventListener('click', () => saveRanking(timeInSeconds));
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveRanking(timeInSeconds);
    });
    
    displayRankings();
}

function saveRanking(timeInSeconds) {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('名前を入力してください');
        return;
    }
    
    const rankings = JSON.parse(localStorage.getItem('typingGameRankings') || '[]');
    const now = new Date();
    const newEntry = {
        name: name,
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
        console.log('ランキングを保存しました:', newEntry);
    } catch (error) {
        console.error('LocalStorageへの保存に失敗しました:', error);
        alert('ランキングの保存に失敗しました。');
        return;
    }
    
    document.querySelector('.ranking-form').style.display = 'none';
    displayRankings();
}

function displayRankings() {
    const rankings = JSON.parse(localStorage.getItem('typingGameRankings') || '[]');
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
    
    checkAnswerRealtime();
});

function displayRankingPreview() {
    const rankings = JSON.parse(localStorage.getItem('typingGameRankings') || '[]');
    
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