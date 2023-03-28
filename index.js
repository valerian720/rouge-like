class Vector2 { 
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;
randomChoice = (arr) => arr[Math.floor(arr.length * Math.random())];

class Game {
  // 
  tileBase = 'tile';
  tileWall = 'tileW';
  tileEnemy = 'tileE';
  tilePlayer = 'tileP';
  tileHealthPotion = 'tileHP';
  tileSword = 'tileSW';
  // 
  lookUpTypes = [this.tileBase, this.tileWall, this.tileEnemy, this.tilePlayer, this.tileHealthPotion, this.tileSword];
  lookUpTypesInverse = this.lookUpTypes.reduce((obj, cur, i) => ({ ...obj, [cur]: i }), {});
  // 
  tileSize = 50; 
  // 
  fieldSizeX = 10;
  fieldSizeY = 10;
  field = [];
  // 
  minRoomCount = 5;
  maxRoomCount = 10;

  minRoomSize = 3;
  maxRoomSize = 8;
  // 
  minHallCount = 3;
  maxHallCount = 5;
  // 
  fieldClass = 'field';
  fieldRoot = null;
  // 
  emptySpaces = [];
  // 
  swordCount = 2;
  healthPotionCount = 10;
  enemyCount = 10;
  // 
  enemyPositions = [];
  playerPosition = null;


  constructor() {
    console.log("Starting...");
    this.captureRoot();
  }

  init() {
    console.log("initialising game...");
    // 
    this.updateFieldSize();
    // 
    this.createField();
    // //////
    this.addHealthPotions();
    this.addSwords();

    this.addPlayer();

    this.addEnemies();
    //
    this.renderScreen();
  }

  captureRoot() {
    this.fieldRoot = document.getElementsByClassName(this.fieldClass)[0];
  }

  // ----------------------------

  updateFieldSize() {
    // ?
    var size = this.fieldRoot.getBoundingClientRect();
    this.fieldSizeX = size.width % this.tileSize / 2 + 1;
    this.fieldSizeY = size.height % this.tileSize / 2 + 1;
  }

  // 

  createField() {
    let tileIndex = this.lookUpTypesInverse[this.tileWall];
    this.field = Array(this.fieldSizeX).fill(0).map(x => Array(this.fieldSizeY).fill(tileIndex));
    // add rooms
    for (let i = 0; i < randomInRange(this.minRoomCount, this.maxRoomCount); i++)
      this.createRoom(new Vector2(randomInRange(0, this.fieldSizeX),randomInRange(0, this.fieldSizeY)), randomInRange( this.minRoomSize, this.maxRoomSize), randomInRange( this.minRoomSize, this.maxRoomSize));

    // add halls
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallX(randomInRange(0, this.fieldSizeX - 1));
    
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallY(randomInRange(0, this.fieldSizeY-1));
    // 
    this.createBorder();
    // 
    console.log(this.field);
    this.calculateEmptySpace();
  }

  createRoom(positionXY, width, length) {
    let tileIndex = this.lookUpTypesInverse[this.tileBase];
    // 
    for (let i = positionXY.x; i < positionXY.x + width; i++) {
      for (let j = positionXY.y; j < positionXY.y + length; j++) {
        if(i < this.fieldSizeX && j < this.fieldSizeY)
          this.field[i][j] = tileIndex;
      }
    }
  }

  createHallX(position) {
    let tileIndex = this.lookUpTypesInverse[this.tileBase];
    // 
    for (let i = 0; i < this.fieldSizeY; i++)
      this.field[position][i] = tileIndex;
  }
  createHallY(position) {
      let tileIndex = this.lookUpTypesInverse[this.tileBase];
      // 
    for (let i = 0; i < this.fieldSizeX; i++)
      this.field[i][position] = tileIndex;
  }

  createBorder() {
    let tileIndex = this.lookUpTypesInverse[this.tileWall];
    for (let i = 0; i < this.fieldSizeX; i++) {
      this.field[i][0] = tileIndex;
      this.field[i][this.fieldSizeY-1] = tileIndex;
    }

    for (let i = 0; i < this.fieldSizeY; i++) {
      this.field[0][i] = tileIndex;
      this.field[this.fieldSizeX-1][i] = tileIndex;
    }
  }
  // ----------------------------
  calculateEmptySpace() {
    let tileIndex = this.lookUpTypesInverse[this.tileBase];

    this.emptySpaces = [];
    this.field.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val === tileIndex) {
          this.emptySpaces.push(new Vector2(i, j));
        }
       }
      )
    });
    console.log(this.emptySpaces);
  }

  popRandomEmptySpace() {
    var position = randomChoice(this.emptySpaces); 
    var index = this.emptySpaces.indexOf(position);
    if (index !== -1) {
      this.emptySpaces.splice(index, 1);
    }
    return position;
  }

  addItemsToField(tileName, count) {
    let usedPositions = [];
    let tileIndex = this.lookUpTypesInverse[tileName];
    for (let i = 0; i < count; i++) {
      var position = this.popRandomEmptySpace();
      this.field[position.x][position.y] = tileIndex;
      usedPositions.push(position);
    }
    return usedPositions;
  }

  addHealthPotions() {
    this.addItemsToField(this.tileHealthPotion, this.healthPotionCount);
  }

  addSwords() {
    this.addItemsToField(this.tileSword, this.swordCount);
  }

  addPlayer() {
    this.playerPosition = this.addItemsToField(this.tilePlayer, 1)[0];
  }

  addEnemies() {
    this.enemyPositions = this.addItemsToField(this.tileEnemy, this.enemyCount);
  }
  // ----------------------------

  renderScreen() {
    this.fieldRoot.replaceChildren();
    // 
    this.field.forEach((row, i) => {
      row.forEach((val, j) => {
        var newElement = document.createElement("div");
        // 
        newElement.classList.add(this.tileBase);
        if (val > 0) 
          newElement.classList.add(this.lookUpTypes[val]);
        newElement.style['top'] = `${i * this.tileSize}px`;
        newElement.style['left'] = `${j * this.tileSize}px`;
        // 
        this.fieldRoot.appendChild(newElement);
       }
      )
    });
  }

}