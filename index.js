class Vector2 { 
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString(){
    return `[${this.x}, ${this.y}]`;
  }
}

function Enum(values){
  const enumObject = values.reduce((obj, cur, i) => ({ ...obj, [cur]: i }), {});;
  return Object.freeze(enumObject);
}

randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;
randomChoice = (arr) => arr[Math.floor(arr.length * Math.random())];

const debugLvl = Enum(['full', 'dev', 'prod', 'none']);

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
  fieldClass = 'field';
  // 
  tileSize = 50; 
  // 
  logLevel = debugLvl.dev;
  // -------------
  // map generation settings
  fieldSizeX = 10;
  fieldSizeY = 10;
  fitTilesToScreen = true;
  // 
  minRoomCount = 5;
  maxRoomCount = 10;

  minRoomSize = 3;
  maxRoomSize = 8;
  // 
  minHallCount = 3;
  maxHallCount = 5;
  // -------------
  // gameplay settings
  swordCount = 2;
  healthPotionCount = 10;
  enemyCount = 10;

  // -------------
  // stored values
  field = [];
  // 
  enemyPositions = [];
  playerPosition = null;
  // 
  fieldRoot = null;
  // 
  emptySpaces = [];
  // 


  constructor() {
    this.Log('Starting...', debugLvl.prod);
    this.captureRoot();
    // 
    this.playerMoveBind();
  }

  init() {
    this.Log('initialising game...', debugLvl.prod);
    // 
    if(this.fitTilesToScreen)
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
    this.Log(`got html element as root with class = '${this.fieldClass}'`);
  }
  // ----------------------------
  // game loop
  playerMoveBind() {
    document.body.addEventListener('keypress',
      (e) => {
        switch (e.key) {
          case 'w':
            this.moveTile(this.playerPosition, -1, 0);
            break;
          case 'a':
            this.moveTile(this.playerPosition, 0, -1);
            break;
        
          case 's':
            this.moveTile(this.playerPosition, 1, 0);
            break;
        
          case 'd':
            this.moveTile(this.playerPosition, 0, 1);
            break;
        
          default:
            break;
        }
        // 
      this.renderScreen();
    }
    );
  }
  
  enemyTick() {

  }

  moveTile(originalPos, deltaX, deltaY) {
    console.log(originalPos, deltaX, deltaY);
    let currentTileSprite = this.lookUpTypes[this.field[originalPos.x][originalPos.y]];
    let nextTileSprite = this.lookUpTypes[this.field[originalPos.x + deltaX][originalPos.y + deltaY]];
    //
    this.spriteLogicAdditional(currentTileSprite, nextTileSprite);
    // 
    if (this.spriteLogicCanGo(currentTileSprite, nextTileSprite)) {
      this.field[originalPos.x][originalPos.y] = this.lookUpTypesInverse[this.spriteLogicStartLocation(currentTileSprite, nextTileSprite)];
      this.field[originalPos.x + deltaX][originalPos.y + deltaY] = this.lookUpTypesInverse[this.spriteLogicFinishLocation(currentTileSprite, nextTileSprite)];
    
      originalPos.x = originalPos.x + deltaX;
      originalPos.y = originalPos.y + deltaY;
      // 
    }
  }
  // game logic
  spriteLogicCanGo(originalSprite, nextSprite) { // ret true / false
    let ret = true;

    if (nextSprite == this.tileWall) {
      ret = false;
    }

    if (nextSprite == this.tileEnemy) {
      ret = false;
    }

    return ret;
  }

  spriteLogicStartLocation(originalSprite, nextSprite) { // ret sprite name
    let ret = this.tileBase;
    return ret;
  }
  
  spriteLogicFinishLocation(originalSprite, nextSprite) { // ret sprite name
    let ret = originalSprite;
    return ret;
  }
  spriteLogicAdditional(originalSprite, nextSprite) { // run needed function
    if (originalSprite == this.tilePlayer) {
      if (nextSprite == this.tileEnemy) {
        this.decreaseHealth();
      }
      if (nextSprite == this.tileHealthPotion) {
        this.increaseHealth();
      }
      if (nextSprite == this.tileSword) {
        this.increaseDamage();
      }
    }
  }
  // ----
  decreaseHealth() {
    this.Log(`health decreased`);
    
  }

  increaseHealth() {
    this.Log(`health increased`);

  }

  increaseDamage() {
    this.Log(`damage increased`);

  }

  // ----------------------------

  updateFieldSize() {
    // ?
    var size = this.fieldRoot.getBoundingClientRect();
    this.fieldSizeX = size.width % this.tileSize / 2 + 1;
    this.fieldSizeY = size.height % this.tileSize / 2 + 1;

    this.Log(`updated field size to ${this.fieldSizeX}x${this.fieldSizeY}`);
  }

  // 

  createField() {
    let tileIndex = this.lookUpTypesInverse[this.tileWall];
    this.Log(`creating field filled with tileId ${tileIndex}`, debugLvl.full);
    this.field = Array(this.fieldSizeX).fill(0).map(x => Array(this.fieldSizeY).fill(tileIndex));
    this.Log(`created empty field`);
    // add rooms
    for (let i = 0; i < randomInRange(this.minRoomCount, this.maxRoomCount); i++)
      this.createRoom(new Vector2(randomInRange(0, this.fieldSizeX),randomInRange(0, this.fieldSizeY)), randomInRange( this.minRoomSize, this.maxRoomSize), randomInRange( this.minRoomSize, this.maxRoomSize));
      this.Log(`added random amount of rooms with random size`, debugLvl.prod);
    // add halls
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallX(randomInRange(0, this.fieldSizeX - 1));
    
      this.Log(`added random amount of halls by X axis`, debugLvl.prod);
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallY(randomInRange(0, this.fieldSizeY-1));
      this.Log(`added random amount of halls by Y axis`, debugLvl.prod);
      // 
    this.createBorder();
    // 
    this.LogObject(`field`, this.field, debugLvl.full)
    this.calculateEmptySpace();
  }

  createRoom(positionXY, width, length) {
    let tileIndex = this.lookUpTypesInverse[this.tileBase];
    this.Log(`creating room at ${positionXY} ${width}x${length} / tileId ${tileIndex}`, debugLvl.full);
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
    this.Log(`creating hall X at ${position} / tileId ${tileIndex}`, debugLvl.full);
    // 
    for (let i = 0; i < this.fieldSizeY; i++)
      this.field[position][i] = tileIndex;
  }
  createHallY(position) {
    let tileIndex = this.lookUpTypesInverse[this.tileBase];
    this.Log(`creating hall Y at ${position} / tileId ${tileIndex}`, debugLvl.full);
    // 
    for (let i = 0; i < this.fieldSizeX; i++)
      this.field[i][position] = tileIndex;
  }

  createBorder() {
    let tileIndex = this.lookUpTypesInverse[this.tileWall];
    this.Log(`creating border / tileId ${tileIndex}`);
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
    this.Log(`calculating list of empty tiles`);
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

    this.LogObject(`spaces`, this.emptySpaces, debugLvl.full)
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
      this.Log(`added tile ${tileName} at position ${position}`, debugLvl.full);
    }
    return usedPositions;
  }

  addHealthPotions() {
    this.Log(`adding health potions`);
    this.addItemsToField(this.tileHealthPotion, this.healthPotionCount);
  }

  addSwords() {
    this.Log(`adding swords`);
    this.addItemsToField(this.tileSword, this.swordCount);
  }

  addPlayer() {
    this.Log(`adding player`);
    this.playerPosition = this.addItemsToField(this.tilePlayer, 1)[0];
    this.LogObject(`player position`, this.playerPosition);
  }

  addEnemies() {
    this.Log(`adding enemies`);
    this.enemyPositions = this.addItemsToField(this.tileEnemy, this.enemyCount);
    this.LogObject(`enemy positions`, this.enemyPositions);
  }
  // ----------------------------

  renderScreen() {
    this.Log(`removig current fieldRoot childred`, debugLvl.full);
    this.fieldRoot.replaceChildren();
    // 
    this.Log(`starting rendering screen`, debugLvl.full);
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
    this.Log(`finished rendering screen`, debugLvl.full);
  }

  // 
  Log(message, lvl = debugLvl.dev) {
    if (this.logLevel <= lvl) {
      console.log(`[${new Date().toLocaleString()}] ${message}`);
    }
  }
  LogObject(message, object, lvl = debugLvl.dev) {
    if (this.logLevel <= lvl) {
      console.log(`[${new Date().toLocaleString()}] ${message} =>`);
      console.log(object);
    }
  }

}