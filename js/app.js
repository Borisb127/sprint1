'use strict'


var gHistory = []
var gBoard
var gLevel = {
    SIZE: 4,
    MINES: 2
}
const LEVELS = {
    easy: { SIZE: 4, MINES: 2 },
    medium: { SIZE: 8, MINES: 12 },
    hard: { SIZE: 12, MINES: 30 }
}
var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0,
    firstClick: true
}
var gLives = 3
var gModalTimeoutId = null

var gStartTime
var gTimerIntervalId



function onInit() {
    console.log('in init')
    if (gModalTimeoutId) {
        clearTimeout(gModalTimeoutId)
        gModalTimeoutId = null
    }

    gHistory = [] // clear undo history 
    gGame = {
        isOn: true,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        firstClick: true
    }

    const modal = document.querySelector('.modal')
    modal.classList.add('hidden')

    gBoard = buildBoard(gLevel.SIZE)

    //placeMines(gBoard, gLevel.MINES)
    //placeMinesStatic(gBoard)
    //setMinesNegsCount(gBoard)

    gLives = 3
    const elSmiley = document.querySelector('.smiley')
    elSmiley.textContent = '😊'
    const elTimer = document.querySelector('.time-count')
    elTimer.innerText = '00:00'
    clearInterval(gTimerIntervalId) // in case already running
    renderLives()
    renderMarkedCount()
    updateBestScore()

    debugPrint(gBoard)
    renderBoard(gBoard)
}


function createCell() {
    return {
        minesAroundCount: 0,
        isRevealed: false,
        isMine: false,
        isMarked: false
    }
}


function setLevel(level) {
    console.log('level:', level)


    gLevel.SIZE = LEVELS[level].SIZE
    gLevel.MINES = LEVELS[level].MINES

    const elLevelBtns = document.querySelectorAll('.level-btn')
    elLevelBtns.forEach(function (btn) {
        var key = btn.textContent.toLowerCase().trim()
        if (key === level) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })

    onInit()
}

////////////////////BOARD LOGIC

function buildBoard(size) {
    var board = []
    for (var i = 0; i < size; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            board[i][j] = createCell()
        }
    }
    return board

}



function renderBoard(board) {

    var elTableBody = document.querySelector('.board tbody')
    // console.log(elTableBody)

    if (!elTableBody) {
        console.warn('No <tbody> found under .board')
        return
    }


    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j]

            var val = getCellText(cell)
            var numClass = ''
            if (cell.isRevealed && !cell.isMine && cell.minesAroundCount > 0) {
                numClass = 'num-' + cell.minesAroundCount
            }


            strHTML += `<td class="cell ${cell.isRevealed ? 'revealed' : ''}
                                        ${cell.isMarked ? 'marked' : ''}
                                        ${numClass}"
                                        data-i="${i}"
                                        data-j="${j}"
                                        onclick="onCellClicked(this, ${i}, ${j})"
                                        oncontextmenu="onCellMarked(event, this, ${i}, ${j})"
                                        >${val}</td>`
        }
        strHTML += '</tr>'
    }

    elTableBody.innerHTML = strHTML

}


function getCellText(cell) {
    if (!cell.isRevealed) return cell.isMarked ? '🚩' : ''
    if (cell.isMine) return '💣'
    if (cell.minesAroundCount > 0) return cell.minesAroundCount
    return ''
}


function onCellClicked(elCell, i, j) {
    console.log('clicked', i, j)
    if (!gGame.isOn) return



    if (gGame.firstClick) {
        placeMines(gBoard, gLevel.MINES, i, j)
        // placeMinesStatic(gBoard)
        setMinesNegsCount(gBoard)
        onStartTimer() // start timer on first click
        debugPrint(gBoard)
        gGame.firstClick = false
        console.log('first click')
    }

    var cell = gBoard[i][j]
    if (cell.isRevealed || cell.isMarked) return // ignore if already shown



    if (cell.isMine) {

        if (elCell.classList.contains('hit'))
            return // prevents multiple hits on same cell

        gLives--
        renderLives()

        const elSmiley = document.querySelector('.smiley')
        elSmiley.textContent = '😵'
        elCell.classList.add('hit')
        elCell.textContent = '💣'

        if (gLives === 0) {
            checkGameOver()
        } else

            setTimeout(function () {
                if (!gGame.isOn) return
                elSmiley.textContent = '😊'
                elCell.classList.remove('hit')
                elCell.textContent = ''
            }, 800)
        return
    }


    // 1. Reveal the cell
    cell.isRevealed = true
    gGame.revealedCount++

    // 2. Handle zero-neighbor expansion
    if (cell.minesAroundCount === 0) {

        expandReveal(gBoard, i, j)
    }

    // 3. Update the whole board
    renderBoard(gBoard)

    // 4. Update the display for marked count
    renderMarkedCount()

    // 5. Check for win/lose
    checkGameOver()

}




function revealAllMines(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j]
            if (cell.isMine) {
                cell.isRevealed = true
            }
        }
    }
}

function expandReveal(board, cellI, cellJ) {
    //console.log('Expanding activated from cell:', cellI, cellJ)

    var size = board.length
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= size) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= size) continue
            if (i === cellI && j === cellJ) continue

            //console.log('Checking neighbor:', i, j)
            var neighbor = board[i][j]


            if (neighbor.isRevealed || neighbor.isMine) continue

            if (neighbor.isMarked) {
                neighbor.isMarked = false // unmark the cell in the model
                gGame.markedCount-- // decrease marked count 
            }
            // reveal this neighbor
            neighbor.isRevealed = true
            gGame.revealedCount++

            if (neighbor.minesAroundCount === 0) {
                expandReveal(board, i, j)
            }
        }
    }
}


function onCellMarked(event, elCell, i, j) {
    event.preventDefault() //  important to prevent default behavior
    console.log('Right-click detected via oncontextmenu attribute!')
    if (!gGame.isOn) return

    const cell = gBoard[i][j]
    if (cell.isRevealed) return // If this cell is already open, do nothing

    cell.isMarked = !cell.isMarked
    gGame.markedCount += cell.isMarked ? 1 : -1
    console.log('Marked count:', gGame.markedCount)
    cell.isMarked
        ? elCell.classList.add('marked')
        : elCell.classList.remove('marked')
    elCell.textContent = getCellText(cell)

    renderMarkedCount()
    checkGameOver()

}



function placeMines(board, mineCount, excludeI, excludeJ) {
    var size = board.length
    var placed = 0

    while (placed < mineCount) {
        var i = Math.floor(Math.random() * size)
        var j = Math.floor(Math.random() * size)

        // skip the first clicked cell
        if (i === excludeI && j === excludeJ) continue


        if (!board[i][j].isMine) {
            board[i][j].isMine = true
            placed++
        }
    }
}


function placeMinesStatic(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) board[i][j].isMine = false
    }

    board[0][1].isMine = true
    board[0][0].isMine = true
}



function setMinesNegsCount(board) {
    var size = board.length
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            board[i][j].minesAroundCount = countNeighbors(board, i, j)
        }
    }
}

function countNeighbors(board, cellI, cellJ) {
    var size = board.length
    var count = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= size) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= size) continue
            if (i === cellI && j === cellJ) continue
            if (board[i][j].isMine) count++
        }
    }
    return count
}


function debugPrint(board) {
    const grid = []
    for (var i = 0; i < board.length; i++) {
        grid[i] = []
        for (var j = 0; j < board[0].length; j++) {
            grid[i][j] = board[i][j].isMine ? 'M' : board[i][j].minesAroundCount
        }
    }
    console.table(grid)
}


////////////////////LIVES LOGIC

function renderLives() {
    console.log('Lives:', gLives)
    var elLiveSpan = document.querySelector('.lives-count')
    elLiveSpan.innerText = '❤️'.repeat(gLives)
}




////////////////////END MODAL LOGIC
function checkGameOver() {
    var elSmiley = document.querySelector('.smiley')


    if (gLives <= 0) {
        gGame.isOn = false
        elSmiley.textContent = '😵'
        revealAllMines(gBoard)
        renderBoard(gBoard)
        onStopTimer()

        gModalTimeoutId = setTimeout(function () {
            showModal('You Lost!')
            gModalTimeoutId = null
        }, 500)

        console.log('You lose!')
        return
    }

    var allMinesMarked = true
    var allSafeRevealed = true

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j]
            if (cell.isMine) {
                if (!cell.isMarked) {
                    allMinesMarked = false
                }
            } else {
                if (!cell.isRevealed) {
                    allSafeRevealed = false
                }  //if
            } //else
        } //for
    } //for

    if (allMinesMarked && allSafeRevealed) {
        gGame.isOn = false
        onStopTimer()
        elSmiley.textContent = '😎'

        // Check and save Best Score
        const key = 'bestScore-' + gLevel.SIZE;
        const currentBestTimeStr = localStorage.getItem(key)
        var isNewBest = true
        if (currentBestTimeStr) {
            const currentBestTime = parseInt(currentBestTimeStr)
            if (gGame.secsPassed >= currentBestTime) {
                isNewBest = false
            }
        }
        if (isNewBest) {
            localStorage.setItem(key, gGame.secsPassed)
        }
        updateBestScore()




        gModalTimeoutId = setTimeout(function () {
            showModal('You Win!')
            gModalTimeoutId = null
        }, 500)


        console.log('You Win!')
        return
    }

    return

}


function showModal(msg) {
    var elModal = document.querySelector('.modal')
    var elMsg = document.querySelector('.modal-msg')
    elMsg.textContent = msg
    elModal.classList.remove('hidden')
}


function onModalOk() {
    var elModal = document.querySelector('.modal')
    elModal.classList.add('hidden')
}



////////////////////MARKED BOX LOGIC
function renderMarkedCount() {
    var elMarkedSpan = document.querySelector('.marked-count')
    elMarkedSpan.innerText = gGame.markedCount
}

////////////////////TIMER BOX LOGIC
function onStartTimer() {
    //console.log('Timer started')

    gStartTime = new Date()

    clearInterval(gTimerIntervalId) // in case already running
    gTimerIntervalId = setInterval(updateTimer, 1000)
}


function updateTimer() {
    var elapsedSec = Math.floor((Date.now() - gStartTime) / 1000)
    var seconds = elapsedSec % 60
    var minutes = Math.floor(elapsedSec / 60)

    // console.log('sec', seconds)
    // console.log('min', minutes)

    // add zero at start
    var mm = String(minutes).padStart(2, '0')
    var ss = String(seconds).padStart(2, '0')


    const elTimer = document.querySelector('.time-count')
    elTimer.innerText = `${mm}:${ss}`
    gGame.secsPassed = elapsedSec
    // elTimer.innerText = `00:${(diff / 1000).toFixed(0)}`
}

function onStopTimer() {
    console.log('Timer stopped')
    clearInterval(gTimerIntervalId) // in case already running
}



////////////////////UNDO LOGIC
function onUndo() {
    console.log('Undo clicked')
}





////////////////////TOGGLE DARK/LIGHT MODE LOGIC
function onToggleDarkMode() {
    console.log('toggle clicked')
    document.body.classList.toggle('light-mode')

    const elBtn = document.querySelector('.mode-toggle-btn')
    if (document.body.classList.contains('light-mode')) {
        elBtn.textContent = 'Dark Mode'
    } else {
        elBtn.textContent = 'Light Mode'
    }
}



////////////////////BEST SCORE LOGIC
function updateBestScore() {
    const elBestScore = document.querySelector('.best-score')

    const key = 'bestScore-' + gLevel.SIZE
    const bestTimeStr = localStorage.getItem(key)
    console.log(key)

    if (!bestTimeStr) {
        elBestScore.innerText = '--:--'
    } else {
        const bestTimeSec = parseInt(bestTimeStr)
        const mm = String(Math.floor(bestTimeSec / 60)).padStart(2, '0')
        const ss = String(bestTimeSec % 60).padStart(2, '0')
        elBestScore.innerText = `${mm}:${ss}`
    }
}


function onResetBestScores() {
    console.log('Reset Best Scores clicked')
    
    localStorage.removeItem('bestScore-4')
    localStorage.removeItem('bestScore-8')
    localStorage.removeItem('bestScore-12')
    onStopTimer()
    onInit()
}
