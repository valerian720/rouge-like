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
  minus(b) {
    return new Vector2(b.x - this.x, b.y - this.y);
  }
  get length(){
  return Math.sqrt(this.x**2 + this.y**2)
  }
  normalize() {
    return new Vector2(this.x / this.length, this.y / this.length);
  }
  normalizeRound() {
    return new Vector2(Math.round(this.x / this.length), Math.round(this.y / this.length));
  }
}

class Enemy {
  health = 50;
  damage = 10;

  minHealth = 20;
  maxHealth = 60;

  difficultyMultyplier = 3;

  get isDead() { return this.health <= 0; }

  position = null;

  constructor(position, difficulty = 1) {
    this.position = position;
    this.health = randomInRange(this.minHealth, this.maxHealth) + difficulty * this.difficultyMultyplier;
  }

  receaveDamage(damage) {
    this.health -= damage;
  }

  static processPositionsToEnemies(positions) {
    var ret = [];

    for (const positionIndex in positions) {
      ret.push(new Enemy(positions[positionIndex]));
    }

    return ret;
  }

  
  static createEnemyMatrix(length, width, enemies) {
    var ret = Array(length).fill(0).map(x => Array(width).fill(null));
    for (const enemyIndex in enemies) {
      let enemy = enemies[enemyIndex];
      let position = enemy.position;
      ret[position.x][position.y] = enemy;
    }

    return ret;
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
  inventoryClass = 'inventory';
  // 
  tileSize = 50; 
  // 
  logLevel = debugLvl.prod;
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
  // 
  playerAttackRange = 1;
  maxPlayerHealth = 100;
  playerDamage = 20;
  maxPlayerDamage = 20;
  // 
  // 
  healthPotionHeal = 30;
  swordDamageIncrease = 20;
  // 
  maxEnemyMovePerTick = 5;
  difficultyActiveEnemyPerLevel = 5; // +1 active enemy per 5 levels
  // -------------
  // stored values
  field = [];
  // 
  enemies = [];
  enemiesList = [];
  playerPosition = null;
  // 
  fieldRoot = null;
  inventoryRoot = null;
  // 
  emptySpaces = [];
  // 
  levelNumber = 1;
  // 
  playerHealth = this.maxPlayerHealth;
  playerDamage = this.maxPlayerDamage;


  constructor() {
    this.Log('Starting...', debugLvl.prod);
    this.captureRoot();
    // 
    this.playerMoveBind();
  }

  init() {
    this.Log('initialising game...', debugLvl.prod);
    // 
    this.playerHealth = this.maxPlayerHealth;
    this.playerDamage = this.maxPlayerDamage;
    this.levelNumber = 0;
    // 
    this.progressLevel();
  }

  progressLevel() {
    this.levelNumber +=1;
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
    this.inventoryRoot = document.getElementsByClassName(this.inventoryClass)[0];
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
          
            case ' ':
            this.playerAttack();
            break;
          
            case 'r':
            this.progressLevel();
            break;
        
          default:
            break;
        }
        // 
        this.enemyTick();
      this.renderScreen();
    }
    );
  }
  
  enemyTick() {
    for (let i = 0; i < this.maxEnemyMovePerTick + ~~(this.levelNumber/this.difficultyActiveEnemyPerLevel); i++) {
      if (i< this.enemiesList.length) {
        let curEnemy = randomChoice(this.enemiesList); // TODO: one enemy could make several moves per enemyTick
        let rndX = randomInRange(1, 4)-2;
        let rndY = randomInRange(1, 4) - 2;

        if ((curEnemy.position.minus(this.playerPosition)).length < 5) { // semi random direction if in activation radius
          var dirVector = curEnemy.position.minus(this.playerPosition).normalizeRound();
          rndX = dirVector.x;
          rndY = dirVector.y;
        }

        let hasMoved = this.moveTile(curEnemy.position, rndX, rndY);
        if (hasMoved) {
          let curPosition = curEnemy.position;
          this.enemies[curPosition.x][curPosition.y] = curEnemy; // add cur pos after move
          this.enemies[curPosition.x-rndX][curPosition.y-rndY] = null; // remove previous pos after move
        }
      }
    }
  }

  moveTile(originalPos, deltaX, deltaY) {
    let ret = false;
    let currentTileSprite = this.lookUpTypes[this.field[originalPos.x][originalPos.y]];
    let nextTileSprite = this.lookUpTypes[this.field[originalPos.x + deltaX][originalPos.y + deltaY]];
    //
    this.spriteLogicAdditional(currentTileSprite, nextTileSprite, originalPos, deltaX, deltaY);
    // 
    if (this.spriteLogicCanGo(currentTileSprite, nextTileSprite)) {
      this.field[originalPos.x][originalPos.y] = this.lookUpTypesInverse[this.spriteLogicStartLocation(currentTileSprite, nextTileSprite)];
      this.field[originalPos.x + deltaX][originalPos.y + deltaY] = this.lookUpTypesInverse[this.spriteLogicFinishLocation(currentTileSprite, nextTileSprite)];
    
      originalPos.x = originalPos.x + deltaX;
      originalPos.y = originalPos.y + deltaY;
      // 
      ret = true;
    }
    return ret;
  }
  // game logic
  spriteLogicCanGo(originalSprite, nextSprite) { // ret true / false
    let ret = true;

    if (originalSprite == this.tileWall)
      ret = false;
    if (originalSprite == this.tileBase)
      ret = false;
    if (nextSprite == this.tileWall)
      ret = false;
    if (nextSprite == this.tileEnemy)
      ret = false;
    if (nextSprite == this.tilePlayer)
      ret = false;

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
  spriteLogicAdditional(originalSprite, nextSprite, originalPos, deltaX, deltaY) { // run needed function
    if (originalSprite == this.tilePlayer) {
      if (nextSprite == this.tileEnemy) {
        this.decreaseHealth(originalPos, deltaX, deltaY);
      }
      if (nextSprite == this.tileHealthPotion) {
        this.increaseHealth();
      }
      if (nextSprite == this.tileSword) {
        this.increaseDamage();
      }
    }

    if (originalSprite == this.tileEnemy) {
      if (nextSprite == this.tilePlayer) {
        this.decreaseHealth(originalPos, deltaX, deltaY);
      }
    }
  }
  // ----
  decreaseHealth(originalPos, deltaX, deltaY) {
    this.Log(`health decreased`);
    let damage = 0;

    if (this.enemies[originalPos.x][originalPos.y] != null) {
      damage = this.enemies[originalPos.x][originalPos.y].damage;
    }
    if (this.enemies[originalPos.x+deltaX][originalPos.y+deltaY] != null) {
      damage = this.enemies[originalPos.x + deltaX][originalPos.y + deltaY].damage;
    }

    this.playerHealth -= damage;
    // 
    if (this.playerHealth < 0) {
      alert("game over");
      this.init();
    }
  }

  increaseHealth() {
    this.Log(`health increased`);
    this.playerHealth += this.healthPotionHeal;
    if (this.playerHealth > this.maxPlayerHealth) {
      this.playerHealth = this.maxPlayerHealth;
    }

  }

  increaseDamage() {
    this.Log(`damage increased`);
    this.playerDamage += this.swordDamageIncrease;
  }
  
  playerAttack() {
    this.Log(`playerAttack`);
    let enemyTileIndex = this.lookUpTypesInverse[this.tileEnemy];
    let emptyTileIndex = this.lookUpTypesInverse[this.tileBase];

    for (let i = this.playerPosition.x - this.playerAttackRange; i < this.playerPosition.x + this.playerAttackRange+1; i++) {
      for (let j = this.playerPosition.y - this.playerAttackRange; j < this.playerPosition.y + this.playerAttackRange+1; j++) {
        if (this.field[i][j] === enemyTileIndex) {
          // have found enemy
          let enemy = this.enemies[i][j];
          enemy.receaveDamage(this.playerDamage);

          if (enemy.isDead) {
          this.field[i][j] = emptyTileIndex;
          this.enemies[i][j] = null;
            
          var index = this.enemiesList.indexOf(enemy);
          if (index !== -1) {
            this.enemiesList.splice(index, 1);
          }
          }
        }
      }
    }
  }

  // ----------------------------

  updateFieldSize() {
    // ?console
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
    let enemyPositions = this.addItemsToField(this.tileEnemy, this.enemyCount);
    this.LogObject(`enemy positions`, enemyPositions, debugLvl.full);
    this.enemiesList = Enemy.processPositionsToEnemies(enemyPositions);
    this.enemies = Enemy.createEnemyMatrix(this.fieldSizeX, this.fieldSizeY , this.enemiesList);
    this.LogObject(`enemiesList`, this.enemiesList, debugLvl.full);
    this.LogObject(`enemies`, this.enemies);
  }
  // ----------------------------

  renderScreen() {
    // render field
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
        // proces health bars
        if ([this.tileEnemy, this.tilePlayer].includes(this.lookUpTypes[val])) {
          var healthElement = document.createElement("div");
          healthElement.classList.add("health");
          let displayedHealth = this.playerHealth;
          if (this.lookUpTypes[val] == this.tileEnemy) {
            displayedHealth = this.enemies[i][j].health;
          }
          healthElement.style['width'] = `${this.tileSize * displayedHealth / 100}px`;
          // 
          newElement.appendChild(healthElement);
        }
        // 
        this.fieldRoot.appendChild(newElement);
       }
      )
    });
    // render inventory
    // ?
    this.inventoryRoot.replaceChildren();

    let levelNumberElement = document.createElement("span");
    levelNumberElement.innerText = `Уровень: ${this.levelNumber}`;

    let playerHealthElement = document.createElement("span");
    playerHealthElement.innerText = `здоровье: ${this.playerHealth}/${this.maxPlayerHealth}`;

    let playerDamageElement = document.createElement("span");
    playerDamageElement.innerText = `Урон: ${this.playerDamage}`;

    this.inventoryRoot.appendChild(levelNumberElement);
    this.inventoryRoot.appendChild(playerHealthElement);
    this.inventoryRoot.appendChild(playerDamageElement);
    // 
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