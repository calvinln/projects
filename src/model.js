export default class Game {
  // Public methods
  constructor(addHandler, moveHandler, mergeHandler) {
    this.addHandler_ = addHandler;
    this.moveHandler_ = moveHandler;
    this.mergeHandler_ = mergeHandler;
  }

  restart() {
    this.score_ = 0;
    this.board_ = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    this.placeNewNumbers_(2);
  }

  slide(direction) {
    let transitions;
    switch (direction) {
      case 'Up':
        const upBoard = rotateBoardLeft(this.board_);
        const slideUpBoard = slideBoardLeft(upBoard);
        this.board_ = rotateBoardLeft(slideUpBoard[0]);

        transitions = slideUpBoard[1];

        for (let i = 0; i < transitions.length; i++) {
          let aTransition = transitions[i];
          const initialRowStart = aTransition.startCol;
          const initialColStart = aTransition.startRow;
          const newFinalRow = aTransition.finalCol;
          const newFinalCol = aTransition.finalRow;
          aTransition.startRow = initialRowStart;
          aTransition.startCol = initialColStart;
          aTransition.finalRow = newFinalRow;
          aTransition.finalCol = newFinalCol;
        }

        this.doTransitions_(transitions);
        break;
      case 'Down':
        let bottomBoard = rotateBoardRight(this.board_);
        let slideBottomBoard = slideBoardLeft(bottomBoard);
        transitions = slideBottomBoard[1];
        this.board_ = rotateBoardRight(
          rotateBoardRight(rotateBoardRight(slideBottomBoard[0]))
        );

        for (let i = 0; i < transitions.length; i++) {
          let initialRowStart;
          let aTransition = transitions[i];
          const tempStartCol = aTransition.startCol;
          const finalCol = aTransition.startRow;
          const initialColStart = aTransition.finalRow;
          if (tempStartCol === 0) {
            initialRowStart = 3;
          } else if (tempStartCol === 1) {
            initialRowStart = 2;
          } else if (tempStartCol === 2) {
            initialRowStart = 1;
          } else {
            initialRowStart = 0;
          }
          let tempFinalCol = aTransition.finalCol;
          let newFinalRow;
          if (tempFinalCol === 0) {
            newFinalRow = 3;
          } else if (tempFinalCol === 1) {
            newFinalRow = 2;
          } else if (tempFinalCol === 2) {
            newFinalRow = 1;
          } else {
            newFinalRow = 0;
          }
          aTransition.finalCol = finalCol;
          aTransition.startCol = initialColStart;
          aTransition.startRow = initialRowStart;
          aTransition.finalRow = newFinalRow;
        }
        this.doTransitions_(transitions);
        break;
      case 'Left':
        const boardAndState = slideBoardLeft(this.board_);
        this.board_ = boardAndState[0];

        transitions = boardAndState[1];

        this.doTransitions_(transitions);
        break;
      case 'Right':
        // slide right only needs to worry about the change in col
        let boardReversed = flipBoard(this.board_);
        let slideReversedBoard = slideBoardLeft(boardReversed);
        this.board_ = flipBoard(slideReversedBoard[0]);

        transitions = slideReversedBoard[1];

        for (let i = 0; i < transitions.length; i++) {
          let aTransition = transitions[i];
          let initialColStart;

          const alteredStartCol = aTransition.startCol;
          if (alteredStartCol === 1) {
            initialColStart = 2;
          } else if (alteredStartCol === 2) {
            initialColStart = 1;
          } else if (alteredStartCol === 0) {
            initialColStart = 3;
          } else {
            initialColStart = 0;
          }

          aTransition.startCol = initialColStart;

          let newFinalCol;
          const alteredFinalCol = aTransition.finalCol;

          if (alteredFinalCol === 0) {
            newFinalCol = 3;
          } else if (alteredFinalCol === 1) {
            newFinalCol = 2;
          } else if (alteredFinalCol === 2) {
            newFinalCol = 1;
          } else {
            newFinalCol = 0;
          }
          aTransition.finalCol = newFinalCol;
        }
        this.doTransitions_(transitions);
        break;
    }
    this.placeNewNumbers_(1);
  }

  getScore() {}

  getBoard() {}

  isGameOver() {}

  // ------------------------------------------------------------------------
  // Private methods

  placeNewNumbers_(count) {
    let emptyIndices = [];
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        if (this.board_[j][k] === 0) {
          emptyIndices.push([j, k]);
        }
      }
    }

    for (let j = 0; j < count; j++) {
      let index = getRandomInt(emptyIndices.length);
      let emptySlot = emptyIndices[index];
      emptyIndices.splice(index, 1);
      let newNumber;
      if (getRandomInt(10) <= 8) {
        newNumber = 2;
      } else {
        newNumber = 4;
      }
      const row = emptySlot[0];
      const col = emptySlot[1];
      this.board_[row][col] = newNumber;

      this.addHandler_(row, col, newNumber, false);
    }
  }

  doTransitions_(transitionArray) {
    const numOfTransitions = transitionArray.length;

    for (let i = 0; i < numOfTransitions; i++) {
      const boxTransition = transitionArray[i];
      const boxName = boxTransition.name;
      if (boxName === 'move') {
        this.moveHandler_(boxTransition);
      } else if (boxName === 'merge') {
        this.mergeHandler_(boxTransition);
      }
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function flipBoard(board) {
  let result = [];
  for (let i = 0; i < 4; i++) {
    let row = board[i].slice().reverse();
    result.push(row);
  }
  return result;
}

function rotateBoardLeft(board) {
  let result = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    result[i].push(board[0][i]);
    result[i].push(board[1][i]);
    result[i].push(board[2][i]);
    result[i].push(board[3][i]);
  }
  return result;
}

// TODO: this can be implemented by a rotateBoardLeft and a flipBoard
function rotateBoardRight(board) {
  let result = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    result[i].push(board[3][i]);
    result[i].push(board[2][i]);
    result[i].push(board[1][i]);
    result[i].push(board[0][i]);
  }
  return result;
}

function slideBoardLeft(board) {
  let resultBoard = [];
  let movePositionBoard = [];
  for (let i = 0; i < 4; i++) {
    const rowAndStates = slideRowLeft(board[i], i);
    const numOfTransitions = rowAndStates[1].length;
    resultBoard.push(rowAndStates[0]);
    for (let j = 0; j < numOfTransitions; j++) {
      movePositionBoard.push(rowAndStates[1][j]);
    }
  }
  return [resultBoard, movePositionBoard];
}

function slideRowLeft(row, rowNumber) {
  let copyOfRow = row.slice();
  let currentIndex = 0;
  let states = [];
  // return an array of objects that has what position it was from and moved to. Then it will
  // make a board of transitions and we can rotate that board like we rotate board
  // to accomodate for the different directions

  for (let i = 1; i < 4; i++) {
    if (copyOfRow[i] === 0) {
      continue;
    }

    let boxState = {};

    // if currentIndex is 0, swap it with the next index value
    if (copyOfRow[currentIndex] === 0) {
      // moveHandler();
      let value = copyOfRow[i];
      copyOfRow[currentIndex] = value;
      boxState.name = 'move';
      boxState.startCol = i;
      boxState.startRow = rowNumber;
      boxState.finalCol = currentIndex;
      boxState.finalRow = rowNumber;
      boxState.val = value;

      states.push(boxState);
    }
    // currentIndex value is the same as i, merge into one
    else if (copyOfRow[currentIndex] === copyOfRow[i]) {
      copyOfRow[currentIndex] += copyOfRow[i];
      // mergeHandler()
      boxState.name = 'merge';
      boxState.startCol = i;
      boxState.startRow = rowNumber;
      boxState.finalCol = currentIndex;
      boxState.finalRow = rowNumber;
      boxState.val = copyOfRow[currentIndex];

      states.push(boxState);
      currentIndex += 1;
    }
    // currentIndex is not same value as i AND value before i is 0
    else if (
      copyOfRow[currentIndex] !== copyOfRow[i] &&
      copyOfRow[i - 1] === 0
    ) {
      // if currentIndex + 1 is 0, we move i there. ex [2, 0, 0, 4]
      if (copyOfRow[currentIndex + 1] === 0) {
        copyOfRow[currentIndex + 1] = copyOfRow[i];
        boxState.name = 'move';
        boxState.startCol = i;
        boxState.startRow = rowNumber;
        boxState.finalCol = currentIndex + 1;
        boxState.finalRow = rowNumber;
        boxState.val = copyOfRow[currentIndex + 1];

        // -------------------------
        currentIndex += 1;
        // -------------------------

        states.push(boxState);
      } else {
        // moving i to i - 1, there isn't consecutive zeroes, just 1 zero before it
        copyOfRow[i - 1] = copyOfRow[i];
        boxState.name = 'move';
        boxState.startCol = i;
        boxState.startRow = rowNumber;
        boxState.finalCol = i - 1;
        boxState.finalRow = rowNumber;
        boxState.val = copyOfRow[i - 1];

        //-------------------------
        // currentIndex += 1;
        //-------------------------
        states.push(boxState);
      }
    } else {
      currentIndex += 1;
      continue;
    }
    copyOfRow[i] = 0;
  }
  return [copyOfRow, states];
}