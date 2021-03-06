/**
 * Location represents a location on the game board by a row number and a column number.
 * Row 0 is the top-most row. Column 0 is the left-most column.
 */

// Model
export class Location {
  constructor(row, column) {
    this.row = row;
    this.column = column;
  }

  isInBoard() {
    return this.row >= 0 && this.row < 4 && this.column >= 0 && this.column < 4;
  }

  /**
   * Swap the row and column of this location.
   */
  swapRowAndColumn() {
    this.temp = this.row;
    this.row = this.column;
    this.column = this.temp;
  }
}

/**
 * Enums for possible Event names.
 */
export const EventName = {
  NUMBER_ADDED: 'number_added',
  NUMBER_MOVED: 'number_moved',
  NUMBER_MERGED: 'number_merged'
};

/**
 *
 */
export class Event {
  constructor(name, startLocation, endLocation, value) {
    this.name = name;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.value = value;
  }
}

export const Direction = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
};

export class Game {
  constructor(eventHandler, deterministic) {
    this.deterministic_ = deterministic;
    this.eventHandler_ = eventHandler;
  }

  reload(board, score) {
    this.score_ = score;
    this.board_ = board;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let val = this.board_[i][j];
        if (val !== 0) {
          this.eventHandler_(
            new Event(EventName.NUMBER_ADDED, new Location(i, j), null, val)
          );
        }
      }
    }
  }

  restart() {
    this.score_ = 0;
    this.board_ = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    this.placeNewNumbers_(2);
  }

  slide(direction) {
    let events;
    switch (direction) {
      case Direction.UP:
        flipDiagonally(this.board_);
        events = this.slideBoardLeft_(this.board_);
        flipDiagonally(this.board_);

        for (let i = 0; i < events.length; i++) {
          let event = events[i];
          event.startLocation.swapRowAndColumn();
          event.endLocation.swapRowAndColumn();
        }
        this.dispatchEvents_(events);
        break;
      case Direction.DOWN:
        flipDiagonally(this.board_);
        flipHorizontally(this.board_);
        events = this.slideBoardLeft_(this.board_);
        flipHorizontally(this.board_);
        flipDiagonally(this.board_);

        for (let i = 0; i < events.length; i++) {
          let event = events[i];
          event.startLocation.column = 3 - event.startLocation.column;
          event.startLocation.swapRowAndColumn();

          event.endLocation.column = 3 - event.endLocation.column;
          event.endLocation.swapRowAndColumn();
        }
        this.dispatchEvents_(events);
        break;
      case Direction.LEFT:
        events = this.slideBoardLeft_(this.board_);
        this.dispatchEvents_(events);
        break;
      case Direction.RIGHT:
        // slide right only needs to worry about the change in col
        flipHorizontally(this.board_);
        events = this.slideBoardLeft_(this.board_);
        flipHorizontally(this.board_);

        for (let i = 0; i < events.length; i++) {
          let event = events[i];
          event.startLocation.column = 3 - event.startLocation.column;
          event.endLocation.column = 3 - event.endLocation.column;
        }
        this.dispatchEvents_(events);
        break;
    }
    if (events.length > 0) {
      this.placeNewNumbers_(1);
    }
  }

  getScore() {
    return this.score_;
  }

  getBoard() {
    return copyBoard(this.board_);
  }

  isGameOver() {
    if (this.isBoardFull_()) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          let currentNumber = this.board_[row][col];
          let locations = [
            new Location(row + 1, col),
            new Location(row - 1, col),
            new Location(row, col + 1),
            new Location(row, col - 1)
          ];
          for (let i = 0; i < 4; i++) {
            let neighbor = locations[i];
            if (neighbor.isInBoard()) {
              if (
                currentNumber === this.board_[neighbor.row][neighbor.column]
              ) {
                return false;
              }
            }
          }
        }
      }
      return true;
    }
  }

  // ------------------------------------------------------------------------
  // Private methods

  isBoardFull_() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.board_[i][j] === 0) {
          return false;
        }
      }
    }
    return true;
  }

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
      let newNumber;
      let index;
      if (this.deterministic_) {
        index = 0;
        newNumber = 2;
      } else {
        index = getRandomInt(emptyIndices.length);
        if (getRandomInt(10) <= 8) {
          newNumber = 2;
        } else {
          newNumber = 4;
        }
      }
      let emptySlot = emptyIndices[index];
      emptyIndices.splice(index, 1);
      const row = emptySlot[0];
      const col = emptySlot[1];
      this.board_[row][col] = newNumber;
      let startLocation = new Location(row, col);
      let event = new Event(
        EventName.NUMBER_ADDED,
        startLocation,
        null,
        newNumber
      );
      this.eventHandler_(event);
    }
  }

  dispatchEvents_(events) {
    events.forEach(event => this.eventHandler_(event));
  }

  slideBoardLeft_(board) {
    let events = [];
    for (let i = 0; i < 4; i++) {
      events = events.concat(this.slideRowLeft_(board[i], i));
    }
    return events;
  }

  slideRowLeft_(row, rowNumber) {
    let currentIndex = 0;
    let events = [];
    // return an array of objects that has what position it was from and moved to. Then it will
    // make a board of transitions and we can rotate that board like we rotate board
    // to accomodate for the different directions

    for (let i = 1; i < 4; i++) {
      if (row[i] === 0) {
        continue;
      }

      let startLocation = new Location(rowNumber, i);
      let endLocation = new Location(rowNumber, currentIndex);

      // if currentIndex is 0, swap it with the next index value
      if (row[currentIndex] === 0) {
        let event = new Event(
          EventName.NUMBER_MOVED,
          startLocation,
          endLocation,
          row[i]
        );
        row[currentIndex] = row[i];
        events.push(event);
      }
      // currentIndex value is the same as i, merge into one
      else if (row[currentIndex] === row[i]) {
        row[currentIndex] += row[i];
        let event = new Event(
          EventName.NUMBER_MERGED,
          startLocation,
          endLocation,
          row[currentIndex]
        );
        this.score_ += row[currentIndex];
        events.push(event);
        currentIndex += 1;
      }
      // currentIndex is not same value as i AND value before i is 0
      else if (row[currentIndex] !== row[i] && row[i - 1] === 0) {
        currentIndex += 1;
        i -= 1;
      } else {
        currentIndex += 1;
        continue;
      }
      row[i] = 0;
    }
    return events;
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function copyBoard(board) {
  let copy = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      copy[i][j] = board[i][j];
    }
  }
  return copy;
}

function flipHorizontally(board) {
  for (let i = 0; i < 4; i++) {
    board[i] = board[i].reverse();
  }
}

function flipDiagonally(board) {
  let copy = copyBoard(board);
  for (let i = 0; i < 4; i++) {
    board[i][0] = copy[0][i];
    board[i][1] = copy[1][i];
    board[i][2] = copy[2][i];
    board[i][3] = copy[3][i];
  }
}
