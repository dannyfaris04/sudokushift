const sudokuContainer = document.querySelector('.sudoku-container');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const hintButton = document.getElementById('hint-btn');
const darkModeButton = document.getElementById('dark-mode-btn');
const pauseButton = document.getElementById('pause-btn');
const difficultySelector = document.getElementById('difficulty-selector');
const backButton = document.getElementById('back-btn');

// Game State Variables
let sudokuGrid = [];
let score = 0;
let timeElapsed = 0;
let timerInterval;
let paused = false;

// Predefined Sudoku Puzzles
const puzzles = {
    easy: [
		[8,7,5,9,2,1,3,4,6],
		[0,6,0,7,5,0,8,0,2],
		[2,4,9,8,6,3,7,1,5],
		[5,0,4,6,0,7,1,2,3], 
		[7,1,3,2,0,8,6,5,0], 
		[9,0,6,1,3,5,4,8,7], 
		[6,9,7,0,1,0,5,3,8], 
		[0,5,0,3,7,9,2,0,4],
		[4,3,2,5,8,0,9,7,1],
    ],
};

// Load Puzzle Based on Difficulty
function loadPuzzles(difficulty) {
    resetGame();
    const puzzle = puzzles[difficulty];
    sudokuGrid = puzzle;
    renderSudoku(puzzle);
    startTimer();
}

function resetGame() {
    clearInterval(timerInterval);
    timeElapsed = 0;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    timerElement.textContent = `Time: 0:00`;
    paused = false;
    pauseButton.textContent = 'Pause';
    toggleGridInteractivity(true);
}

// Render Sudoku Grid
function renderSudoku(grid) {
    sudokuContainer.innerHTML = '';
    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = createCellElement(cell, rowIndex, colIndex);
            sudokuContainer.appendChild(cellElement);
        });
    });
}

function createCellElement(cell, rowIndex, colIndex) {
    const cellElement = document.createElement('input');
    cellElement.type = 'text';
    cellElement.maxLength = 1;
    cellElement.classList.add('sudoku-cell');
    if (cell !== 0) {
        cellElement.value = cell;
        cellElement.disabled = true;
    }
    cellElement.addEventListener('input', (e) => handleInput(e, rowIndex, colIndex));
    return cellElement;
}

// Timer Functions
function startTimer() {
    timerInterval = setInterval(() => {
        if (!paused) {
            updateTimer();
        }
    }, 1000);
}

function updateTimer() {
    timeElapsed++;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Game Control Functions
pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    toggleGridInteractivity(!paused);
});

backButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to go back? Your current game progress will be lost.")) {
         window.location.href = 'home.html';
    }
});

function toggleGridInteractivity(enabled) {
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach((cell) => {
        if (!cell.disabled) {
            cell.readOnly = !enabled;
        }
        handleCellValueToggle(cell, enabled);
    });
}

function handleCellValueToggle(cell, enabled) {
    if (!enabled) {
        if (cell.value !== "") {
            cell.dataset.originalValue = cell.value;
            cell.value = '*';
        }
    } else if (cell.dataset.originalValue) {
        cell.value = cell.dataset.originalValue;
        delete cell.dataset.originalValue;
    }
}

// Handle Input & Game Logic
function handleInput(event, row, col) {
    const value = parseInt(event.target.value);
    handleNormalMode(event, value, row, col);
}

function handleNormalMode(event, value, row, col) {
    if (isNaN(value) || value < 1 || value > 9) {
        event.target.value = '';
        return;
    }
    const correctValue = getSolutionValue(row, col);
    if (value === correctValue) {
        score += sudokuGrid[row][col] === 0 ? 2 : 0;
        event.target.classList.remove('wrong');
    } else {
        if (!event.target.classList.contains('wrong')) {
            score -= 2;
        }
        event.target.classList.add('wrong');
    }
    scoreElement.textContent = `Score: ${score}`;
    sudokuGrid[row][col] = value;
    checkCompletion();
}

// Completion Check & Score Submission
function checkCompletion() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (!isCellCorrect(row, col)) return false;
        }
    }

    clearInterval(timerInterval);
    alert("Congratulations! You've completed the Sudoku!");
    handleScoreSubmission();
    return true;
}

function isCellCorrect(row, col) {
    const value = sudokuGrid[row][col];
    const correctValue = getSolutionValue(row, col);
    return value !== 0 && value === correctValue;
}

function handleScoreSubmission() {
    const playerName = prompt("Please enter your name:");
    if (playerName) {
        submitScore(playerName);
    } else {
        alert("You didn't enter your name.");
    }
}

function submitScore(playerName) {
    const finalScore = score;
    const finalTime = `${Math.floor(timeElapsed / 60)}:${timeElapsed % 60 < 10 ? '0' : ''}${timeElapsed % 60}`;
    const formData = new FormData();
    formData.append('player_name', playerName);
    formData.append('score', finalScore);
    formData.append('time_elapsed', finalTime);

    fetch('leaderboard.php', { method: 'POST', body: formData })
        .then(response => response.text())
        .then(data => {
            alert(data);
            window.location.href = "leaderboard.html";
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save score.');
        });
}

// Utility Functions
darkModeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

hintButton.addEventListener('click', () => {
    if (score > 0) {
        score -= 2;
        scoreElement.textContent = `Score: ${score}`;
        provideHint();
    } else {
        alert("You need at least 0 points to use a hint.");
    }
});

function provideHint() {
    const emptyCells = getEmptyCells();
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = getSolutionValue(randomCell.row, randomCell.col);
        sudokuGrid[randomCell.row][randomCell.col] = correctValue;
        renderSudoku(sudokuGrid);
    }
}

function getEmptyCells() {
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudokuGrid[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }
    return emptyCells;
}

function getSolutionValue(row, col) {
    const solution = [
		[8,7,5,9,2,1,3,4,6],
		[3,6,1,7,5,4,8,9,2],
		[2,4,9,8,6,3,7,1,5],
		[5,8,4,6,9,7,1,2,3], 
		[7,1,3,2,4,8,6,5,9], 
		[9,2,6,1,3,5,4,8,7], 
		[6,9,7,4,1,2,5,3,8], 
		[1,5,8,3,7,9,2,6,4],
		[4,3,2,5,8,6,9,7,1],
    ];
    return solution[row][col];
}

// Event Listeners for Difficulty Change
difficultySelector.addEventListener('change', (e) => {
    loadPuzzles(e.target.value);
});

// Initialize Game with Easy Difficulty
loadPuzzles('easy');