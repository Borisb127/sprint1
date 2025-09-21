'use strict'



var gBoard
var gLevel = {
    SIZE: 4,
    MINES: 2
}
var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0,
    firstClick: true
}
var gLives = 3


function onInit() {
    console.log('in init')
    gGame = {
        isOn: true,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        firstClick: true
    }

    gBoard = buildBoard(gLevel.SIZE)

    //placeMines(gBoard, gLevel.MINES)
    //placeMinesStatic(gBoard)
    // setMinesNegsCount(gBoard)

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

            var val = ''
            if (cell.isRevealed) {
                if (cell.isMine) val = 'M'
                else if (cell.minesAroundCount > 0) val = cell.minesAroundCount


            }

            strHTML += `<td class="cell ${cell.isRevealed ? 'revealed' : ''}"
                            data-i="${i}"
                            data-j="${j}"
                            onclick="onCellClicked(this, ${i}, ${j})">${val}</td>`
        }
        strHTML += '</tr>'
    }

    elTableBody.innerHTML = strHTML

}


function onCellClicked(elCell, i, j) {
    console.log('clicked', i, j)


    if (gGame.firstClick) {
        // placeMines(gBoard, gLevel.MINES, i, j)
        placeMinesStatic(gBoard)

        setMinesNegsCount(gBoard)
        debugPrint(gBoard)
        gGame.firstClick = false
        console.log('first click')
    }



    if (!gGame.isOn) return

    var cell = gBoard[i][j]
    if (cell.isRevealed) return // ignore if already shown

    cell.isRevealed = true
    gGame.revealedCount++

    elCell.classList.add('revealed')
    elCell.textContent = cell.isMine ? 'M' : (cell.minesAroundCount > 0 ? cell.minesAroundCount : '')
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