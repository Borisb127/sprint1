'use strict'



var gBoard
var gLevel = {
    SIZE: 4,
    MINES: 3
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
var gTimeId = null



function onInit() {
    console.log('in init')
    if (gModalTimeoutId) {
        clearTimeout(gModalTimeoutId)
        gModalTimeoutId = null
    }


    gGame = {
        isOn: true,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        firstClick: true
    }

    var modal = document.querySelector('.modal')
    modal.classList.add('hidden')

    gBoard = buildBoard(gLevel.SIZE)

    //placeMines(gBoard, gLevel.MINES)
    //placeMinesStatic(gBoard)
    //setMinesNegsCount(gBoard)

    gLives = 3
    var elSmiley = document.querySelector('.smiley')
    elSmiley.textContent = '😊'
    renderLives()

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


            strHTML += `<td class="cell ${cell.isRevealed ? 'revealed' : ''}
                                         ${cell.isMarked ? 'marked' : ''}"
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


        if (gLives === 0) {
            checkGameOver()
        }

        elCell.classList.add('hit')
        elCell.textContent = '💣'

        setTimeout(function () {
            if (!gGame.isOn) return
            elSmiley.textContent = '😊'
            elCell.classList.remove('hit')
            elCell.textContent = ''
        }, 800)

        return
    }



    // if cell has no neighboring mines, expand:
    if (cell.minesAroundCount === 0) {
        cell.isRevealed = true
        gGame.revealedCount++

        expandReveal(gBoard, i, j)
        renderBoard(gBoard)
        checkGameOver()
        return
    }


    cell.isRevealed = true
    gGame.revealedCount++

    elCell.classList.add('revealed')
    elCell.textContent = getCellText(cell)
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
            if (neighbor.isMarked) gGame.markedCount-- // decrease marked count 

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
        elSmiley.textContent = '😎'

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





////////////////////TIMER LOGIC