let fieldObject = [];
let fieldNode = document.querySelector(".field");
fieldNode.querySelectorAll(".row").forEach(e => {
    let cells = e.querySelectorAll(".cell");
    let row = [];
    cells.forEach(c => {
        row.push(c);
        c.addEventListener("click", cellClickHandler);
    });
    fieldObject.push(row);
});
let fieldSize = fieldObject.length;
let players = [
    { name: "cross", className: "ch", plural: "Crosses" },
    { name: "round", className: "r", plural: "Toes" }
];
let winClassesNames = ["horizontal", "vertical", "diagonal-right", "diagonal-left"];
let moves = [];
let cancelledMoves = [];

let wonTitleElement = document.querySelector(".won-title");
let wonMessageElement = document.querySelector(".won-message");
let undoButton = document.querySelector(".undo-btn");
let redoButton = document.querySelector(".redo-btn");
let restartButton = document.querySelector(".restart-btn");
undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);
restartButton.addEventListener("click", resetGame);

let saved = JSON.parse(localStorage.getItem("ticTacToeMoves"));
if (saved && saved.length > 0) {
    let savedMoves = saved[0];
    let savedCancelledMoves = saved[1];
    savedMoves.forEach(e => move(fromCellID(e.target), e.player));
    if (savedCancelledMoves && savedCancelledMoves.length > 0) cancelledMoves = savedCancelledMoves;
}

window.addEventListener("storage", function(event) {
    if (event.key === "ticTacToeMoves" && event.oldValue !== event.newValue) {
        let saved = event.newValue;
        resetGame(true);
        let savedCancelledMoves = JSON.parse(saved)[1];
        savedMoves = JSON.parse(saved)[0];
        if (savedMoves) savedMoves.forEach(e => move(fromCellID(e.target), e.player, true));
        if (savedCancelledMoves && savedCancelledMoves.length > 0) cancelledMoves = savedCancelledMoves;
        manageDoButtons();
    }
});

function resetGame(copied = false) {
    fieldNode.querySelectorAll(".cell").forEach(e => {
        players.forEach(p => e.classList.remove(p.className));
        winClassesNames.forEach(p => e.classList.remove(p));
        e.classList.remove("win");
    });
    undoButton.disabled = true;
    redoButton.disabled = true;
    wonTitleElement.classList.add("hidden");
    moves = [];
    cancelledMoves = [];
    if (copied !== true) localStorage.setItem("ticTacToeMoves", JSON.stringify([]));
}

function cellClickHandler(e) {
    if (wonTitleElement.classList.contains("hidden")) {
        let player = players[moves.length % players.length];
        move(e.target, player);
    }
}

function move(target, player, copied = false) {
    cancelledMoves = [];
    target.classList.add(player.className);
    moves.push({ target: target.id, player: player });
    manageDoButtons();
    checkForWin(target, fieldObject, player);
    if (!copied) localStorage.setItem("ticTacToeMoves", JSON.stringify([moves, cancelledMoves]));
}

function checkForWin(target, field, player) {

    // Horizontaly
    let horizontal = field.filter(e => e.includes(target))[0];
    if (horizontal.every(e => e.classList.contains(player.className))) {
        return endGame(player, [horizontal, "horizontal"]);
    }

    // Vertically
    let vertical = Array.from(
        document.querySelectorAll(".cell:nth-child(3n+" + ((+target.id.slice(2) % 3) + 1).toString() + ")")
    );
    if (vertical.every(e => e.classList.contains(player.className))) {
        return endGame(player, [vertical, "vertical"]);
    }

    // Major diagonal
    if (+target.id.slice(2) % (fieldSize + 1) === 0) {
        let diagonalMajor = Array.from(document.querySelectorAll(".cell")).filter(
            e => +e.id.slice(2) % (fieldSize + 1) === 0
        );
        if (diagonalMajor.every(e => e.classList.contains(player.className))) {
            return endGame(player, [diagonalMajor, "diagonal-right"]);
        }
    }

    // Minor diagonal
    if (+target.id.slice(2) % (fieldSize - 1) === 0) {
        let diagonalMinor = Array.from(document.querySelectorAll(".cell")).filter(
            e =>
                +e.id.slice(2) % (fieldSize - 1) === 0 && +e.id.slice(2) !== 0 && +e.id.slice(2) !== fieldSize * fieldSize - 1
        );
        if (diagonalMinor.every(e => e.classList.contains(player.className))) {
            return endGame(player, [diagonalMinor, "diagonal-left"]);
        }
    }

    // Draw
    if (document.querySelectorAll(".cell:not(.ch):not(.r) ").length === 0) {
        return endGame(false);
    }

    return false;
}

function endGame(player = false, cells = null) {
    wonTitleElement.classList.remove("hidden");
    if (player) {
        wonMessageElement.textContent = player.plural + " won!";
        cells[0].forEach(e => {
            e.classList.add(cells[1]);
            e.classList.add("win");
        });
    } else {
        wonMessageElement.textContent = "It's a draw!";
    }
    redoButton.disabled = true;
    undoButton.disabled = true;
    return true;
}

function undo() {
    let move = moves.pop();
    cancelledMoves.push(move);
    players.forEach(e => {
        fromCellID(move.target).classList.remove(e.className);
    });
    manageDoButtons();
    updateLocalStorage();
}

function redo() {
    let move = cancelledMoves.pop();
    moves.push(move);
    fromCellID(move.target).classList.add(move.player.className);
    manageDoButtons();
    updateLocalStorage();
}

function fromCellID(id) {
    return document.querySelector("#" + id);
}

function updateLocalStorage() {
    localStorage.setItem("ticTacToeMoves", JSON.stringify([moves, cancelledMoves]));
}

function manageDoButtons() {
    redoButton.disabled = cancelledMoves.length === 0;
    undoButton.disabled = moves.length === 0;
    if (!wonTitleElement.classList.contains("hidden")) {
        redoButton.disabled = undoButton.disabled = true;
    }
}
