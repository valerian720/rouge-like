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

function Enum(values){
  const enumObject = values.reduce((obj, cur, i) => ({ ...obj, [cur]: i }), {});;
  return Object.freeze(enumObject);
}

randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;
randomChoice = (arr) => arr[Math.floor(arr.length * Math.random())];

const logLevels = Enum(['full', 'dev', 'prod', 'none']);

class Logable {
  logLevel = logLevels.prod;
  // 
  Log(message, lvl = logLevels.dev) {
    if (this.logLevel <= lvl) {
      console.log(`[${new Date().toLocaleString()}] ${message}`);
    }
  }
  LogObject(message, object, lvl = logLevels.dev) {
    if (this.logLevel <= lvl) {
      console.log(`[${new Date().toLocaleString()}] ${message} =>`);
      console.log(object);
    }
  }
}

// ---------------------------
class TileBase extends Logable {
  static tileSize = 50;
  tileBaseName = 'tile';
  tileName = '';
  // 
  position = null;
  difficulty = 1;

  toString() {
    return this.tileName;
  }
}

class TilePath extends TileBase {
}

//

class Entity extends TileBase {
  maxHealth = 50;

  health = 50;
  damage = 20;

  get isDead() { return this.health <= 0; }

  receaveDamage(damage) {
    this.health -= damage;
    if (this.isDead)
      this.onDeathLogic();
  }

  onDeathLogic() {
  }

  dealDamage(target) {
    if (target instanceof Entity)
    target.receaveDamage(this.damage);
  }

  increaseDamage(amount) {
    this.damage += amount;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth)
      this.health = this.maxHealth;
  }

  collisionCheck(target) {
    let ret = true;

    if (target instanceof TileWall)
      ret = false;
    if (target instanceof Entity)
      ret = false;
    
    return ret;
  }
  getTrailTile() {
    return new TilePath();
  }

  applyCollision(target) {
  }
}

class Enemy extends Entity {
  tileName = 'tileE';
  // 
  health = 50;
  damage = 15;

  minHealth = 20;
  maxHealth = 60;

  difficultyMultyplier = 3;

  set difficulty(value) { this.health += value * this.difficultyMultyplier}

  constructor() {
    super();
    this.health = randomInRange(this.minHealth, this.maxHealth);
  }

  applyCollision(target) {
    if(target instanceof Player)
      this.dealDamage(target);
  }
}

// 

class Player extends Entity {
  tileName = 'tileP';
  // gameplay settings
  playerAttackRange = 1;
  maxHealth = 100;
  minDamage = 20;
  // 
  gameManager = null;
  // 
  constructor(gameManager) {
    super();
    this.reset();
    // 
    this.gameManager = gameManager;
    // 
    this.playerMoveBind();
  }

  reset() {
    this.health = this.maxHealth;
    this.damage = this.minDamage;
  }

  onDeathLogic() {
    alert("Game over.\nTry Again.");
    this.gameManager.reset();
  }

  playerMoveBind() {
    document.body.addEventListener('keypress',
      (e) => {
        switch (e.key) {
          case 'w':
          case 'ц':
            this.gameManager.field.moveTile(this, -1, 0);
            break;
          
          case 'a':
          case 'ф':
            this.gameManager.field.moveTile(this, 0, -1);
            break;
        
          case 's':
          case 'ы':
            this.gameManager.field.moveTile(this, 1, 0);
            break;
        
          case 'd':
          case 'в':
            this.gameManager.field.moveTile(this, 0, 1);
            break;
          
          case ' ':
            this.playerAttack();
            break;
          
          case 'r':
          case 'к':
            this.gameManager.progressLevel();
            break;
        
          default:
            break;
        }
      // 
      this.gameManager.renderFrame();
    }
    );
  }
  // 
  playerAttack() {
    this.Log(`playerAttack`);
    let field = this.gameManager.field.fieldMatrix;

    for (let i = this.position.x - this.playerAttackRange; i < this.position.x + this.playerAttackRange+1; i++) {
      for (let j = this.position.y - this.playerAttackRange; j < this.position.y + this.playerAttackRange+1; j++) {
        if (field[i][j] instanceof Enemy) {
          // have found enemy
          let enemy = field[i][j];
          this.dealDamage(enemy);
          this.Log(`attacked enemy by ${this.damage} dmg at [${i}x${j}]`, logLevels.full);
        }
      }
    }
  }

  applyCollision(target) {
    target.dealDamage(this);
  }

}

// 

class Pickup extends TileBase {
  applyEffect(target) {
  }
}

class Sword extends Pickup { 
  tileName = 'tileSW';
  // gameplay settings
  swordDamageIncrease = 20;
  // 
  applyEffect(target) {
    target.increaseDamage(this.swordDamageIncrease);
  }
}

class HealPotion extends Pickup { 
  tileName = 'tileHP';
  // gameplay settings
  healthPotionHeal = 30;
  // 
  applyEffect(target) {
    target.heal(this.healthPotionHeal);
  }
}

// 

class TileWall extends TileBase {
  tileName = 'tileW';
}

//

class Field extends Logable {
  // gameplay settings
  swordCount = 2;
  healthPotionCount = 10;
  enemyCount = 10;
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
  // 
  fieldMatrix = [];
  emptySpaces = [];
  difficulty = 1;

  constructor() {
    super();
    this.generateField();
  }

  generateField(difficulty = 1) {
    this.Log(`generateField`);
    if(this.fitTilesToScreen)
      this.updateFieldSize();
    // 
    this.createField();
    // //////
    this.addHealthPotions();
    this.addSwords();

    this.addEnemies();
  }

  // 
  updateFieldSize() {
    // ?
    // var size = this.fieldRoot.getBoundingClientRect();
    var size = { width: 1920, height: 1080 };
    this.fieldSizeX = size.width % TileBase.tileSize / 2 + 1;
    this.fieldSizeY = size.height % TileBase.tileSize / 2 + 1;

    this.Log(`updated field size to ${this.fieldSizeX}x${this.fieldSizeY}`);
  }

  // ----------------------------

  createField() {
    this.Log(`creating field filled with TileWall`, logLevels.full);
    this.fieldMatrix = Array(this.fieldSizeX).fill(0).map(x => Array(this.fieldSizeY).fill(new TileWall()));
    this.Log(`created empty field`);
    // add rooms
    for (let i = 0; i < randomInRange(this.minRoomCount, this.maxRoomCount); i++)
      this.createRoom(new Vector2(randomInRange(0, this.fieldSizeX),randomInRange(0, this.fieldSizeY)), randomInRange( this.minRoomSize, this.maxRoomSize), randomInRange( this.minRoomSize, this.maxRoomSize));
      this.Log(`added random amount of rooms with random size`, logLevels.prod);
    // add halls
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallX(randomInRange(0, this.fieldSizeX - 1));
    
      this.Log(`added random amount of halls by X axis`, logLevels.prod);
    for (let i = 0; i < randomInRange(this.minHallCount, this.maxHallCount); i++)
      this.createHallY(randomInRange(0, this.fieldSizeY-1));
      this.Log(`added random amount of halls by Y axis`, logLevels.prod);
      // 
    this.createBorder();
    // 
    this.LogObject(`field`, this.fieldMatrix, logLevels.full)
    this.calculateEmptySpace();
  }

  createRoom(positionXY, width, length) {
    this.Log(`creating room at ${positionXY} ${width}x${length}`, logLevels.full);
    //
    for (let i = positionXY.x; i < positionXY.x + width; i++) {
      for (let j = positionXY.y; j < positionXY.y + length; j++) {
        if(i < this.fieldSizeX && j < this.fieldSizeY)
          this.fieldMatrix[i][j] = new TilePath();
      }
    }
  }

  createHallX(position) {
    this.Log(`creating hall X at ${position}`, logLevels.full);
    // 
    for (let i = 0; i < this.fieldSizeY; i++)
      this.fieldMatrix[position][i] = new TilePath();
  }
  createHallY(position) {
    this.Log(`creating hall Y at ${position}`, logLevels.full);
    // 
    for (let i = 0; i < this.fieldSizeX; i++)
      this.fieldMatrix[i][position] = new TilePath();
  }

  createBorder() {
    this.Log(`creating border`);
    for (let i = 0; i < this.fieldSizeX; i++) {
    this.fieldMatrix[i][0] = new TileWall();
      this.fieldMatrix[i][this.fieldSizeY-1] = new TileWall();
    }

    for (let i = 0; i < this.fieldSizeY; i++) {
      this.fieldMatrix[0][i] = new TileWall();
      this.fieldMatrix[this.fieldSizeX-1][i] = new TileWall();
    }
  }
  // ----------------------------
  calculateEmptySpace() {
    this.Log(`calculating list of empty tiles`);

    this.emptySpaces = [];
    this.fieldMatrix.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val instanceof TilePath) {
          this.emptySpaces.push(new Vector2(i, j));
        }
       }
      )
    });

    this.LogObject(`spaces`, this.emptySpaces, logLevels.full)
  }

  popRandomEmptySpace() {
    var position = randomChoice(this.emptySpaces); 
    var index = this.emptySpaces.indexOf(position);
    if (index !== -1) {
      this.emptySpaces.splice(index, 1);
    }
    return position;
  }

  addItemsToField(tileObjectType, count) {
    let usedObjects = [];
    for (let i = 0; i < count; i++) {
      let tile = new tileObjectType();
      var position = this.popRandomEmptySpace();
      this.fieldMatrix[position.x][position.y] = tile;
      tile.position = position;
      tile.difficulty = this.difficulty;

      usedObjects.push(tile);
      this.Log(`added tile ${tile} at position ${position}`, logLevels.full);
    }
    return usedObjects;
  }
  addItemToField(tileObject) {
    var position = this.popRandomEmptySpace();
    this.fieldMatrix[position.x][position.y] = tileObject;
    tileObject.position = position;
    this.Log(`added tile ${tileObject} at position ${position}`, logLevels.full);
    return tileObject;
  }

  addHealthPotions() {
    this.Log(`adding health potions`);
    this.addItemsToField(HealPotion, this.healthPotionCount);
  }

  addSwords() {
    this.Log(`adding swords`);
    this.addItemsToField(Sword, this.swordCount);
  }

  addPlayer(player) {
    this.Log(`adding player`);
    this.addItemToField(player);
    this.LogObject(`player position`, player.position);
  }

  addEnemies() {
    this.Log(`adding enemies`);
    this.enemiesList = this.addItemsToField(Enemy, this.enemyCount);
    this.LogObject(`enemiesList`, this.enemiesList, logLevels.full);
  }

  createEnemyProcessor(gameManager) {
    return new EnemyProcessor(this.enemiesList, gameManager);
  }

  // ----------------------------
  moveTile(originalEntity, deltaX, deltaY) {
    let ret = false;
    let originalPos = originalEntity.position;

    let targetEntity = this.fieldMatrix[originalPos.x+deltaX][originalPos.y+deltaY];

    if (targetEntity instanceof Entity) {
      originalEntity.applyCollision(targetEntity);
    }

    if (originalEntity.collisionCheck(targetEntity)) {
      if (targetEntity instanceof Pickup) {
        targetEntity.applyEffect(originalEntity);
      }
      // swap 
      this.fieldMatrix[originalPos.x][originalPos.y] = originalEntity.getTrailTile();
      originalPos.x += deltaX;
      originalPos.y += deltaY;
      this.fieldMatrix[originalPos.x][originalPos.y] = originalEntity;
      ret = true;
    }
    // let currentTileSprite = this.lookUpTypes[this.field[originalPos.x][originalPos.y]];
    // let nextTileSprite = this.lookUpTypes[this.field[originalPos.x + deltaX][originalPos.y + deltaY]];
    // //
    // this.spriteLogicAdditional(currentTileSprite, nextTileSprite, originalPos, deltaX, deltaY);
    // 
    // if (this.spriteLogicCanGo(currentTileSprite, nextTileSprite)) {
      // this.field[originalPos.x][originalPos.y] = this.lookUpTypesInverse[this.spriteLogicStartLocation(currentTileSprite, nextTileSprite)];
      // this.field[originalPos.x + deltaX][originalPos.y + deltaY] = this.lookUpTypesInverse[this.spriteLogicFinishLocation(currentTileSprite, nextTileSprite)];
    
      // originalPos.x = originalPos.x + deltaX;
      // originalPos.y = originalPos.y + deltaY;
      // 
    //   ret = true;
    // }
    return ret;
  }

}

class EnemyProcessor extends Logable { // hive mind
  difficultyActiveEnemyPerLevel = 5;
  maxEnemyMovePerTick = 5;
  enemySearchRadius = 5;
  // 
  gameManager = null;
  player = null;
  enemiesList = [];
  // 
  
  constructor(enemiesList, gameManager) {
    super();
    this.enemiesList = enemiesList;
    this.gameManager = gameManager;
  }

  removeKilled() {
    let toPop = [];
    this.enemiesList.forEach((enemy) => {
      if (enemy.isDead) {
        toPop.push(enemy);
        this.gameManager.field.fieldMatrix[enemy.position.x][enemy.position.y] = enemy.getTrailTile();
      }
    });

    this.enemiesList = this.enemiesList.filter( (el) => !toPop.includes(el) );
  }
    
  moveEnemies(levelNumber) {

    let enemyToMoveList = [...this.enemiesList];
    for (let i = 0; i < this.maxEnemyMovePerTick + Math.floor(levelNumber/this.difficultyActiveEnemyPerLevel); i++) {
      if (i < this.enemiesList.length) {
        let curEnemy = randomChoice(enemyToMoveList);
        if (curEnemy !== null) {
          this.LogObject(`selected enemy to act (${i+1} of ${this.maxEnemyMovePerTick + Math.floor(levelNumber/this.difficultyActiveEnemyPerLevel)})`, curEnemy, logLevels.full);

          var index = enemyToMoveList.indexOf(curEnemy);
            if (index !== -1) {
              enemyToMoveList.splice(index, 1);
            }

          let rndX = randomInRange(-1, 2);
          let rndY = randomInRange(-1, 2);
          this.Log(`enemy will move by ${rndX}(x) ${rndY}(y)`, logLevels.full);

          if ((curEnemy.position.minus(this.gameManager.player.position)).length < this.enemySearchRadius) { // semi random direction if in activation radius
            var dirVector = curEnemy.position.minus(this.gameManager.player.position).normalizeRound();
            rndX = dirVector.x;
            rndY = dirVector.y;
            this.Log(`player detected, enemy will move by ${rndX}(x) ${rndY}(y)`, logLevels.full);
          }
          let hasMoved = this.gameManager.field.moveTile(curEnemy, rndX, rndY);
          if (hasMoved)
            this.Log(`enemy move is succesfull`, logLevels.full);
        }
      }
    }
  }
}



class Game extends Logable {
  fieldClass = 'field';
  inventoryClass = 'inventory';
  // // 
  // tileSize = 50; 
  // // 
  // logLevel = logLevels.prod;
  // // -------------
  // // map generation settings
  // fieldSizeX = 10;
  // fieldSizeY = 10;
  // fitTilesToScreen = true;
  // // 
  // minRoomCount = 5;
  // maxRoomCount = 10;

  // minRoomSize = 3;
  // maxRoomSize = 8;
  // // 
  // minHallCount = 3;
  // maxHallCount = 5;
  // // -------------
  // // gameplay settings
  // swordCount = 2;
  // healthPotionCount = 10;
  // enemyCount = 10;
  // enemySearchRadius = 5;
  // // 
  // playerAttackRange = 1;
  // maxPlayerHealth = 100;
  // playerDamage = 20;
  // maxPlayerDamage = 20;
  // // 
  // // 
  // healthPotionHeal = 30;
  // swordDamageIncrease = 20;
  // // 
  // maxEnemyMovePerTick = 5;
  // difficultyActiveEnemyPerLevel = 5; // +1 active enemy per 5 levels
  // // -------------
  // // stored values
  // field = [];
  // // 
  // enemies = [];
  // enemiesList = [];
  // playerPosition = null;
  // // 
  // // 
  // emptySpaces = [];
  // // 
  // // 
  // playerHealth = this.maxPlayerHealth;
  // playerDamage = this.maxPlayerDamage;
  // // -------------
  levelNumber = 1;
  fieldRoot = null;
  inventoryRoot = null;
  // 
  field = null;
  player = null;


  constructor() {
    super();
    this.Log('Starting...', logLevels.prod);
    this.captureRoot();
  }

  init() {
    this.Log('initialising game...', logLevels.prod);
    // 
    this.player = new Player(this);
    this.field = new Field();

    this.prepareAdditionalLogic();
    // 
    // this.playerHealth = this.maxPlayerHealth;
    // this.playerDamage = this.maxPlayerDamage;
    this.levelNumber = 1;
    // 
    this.renderScreen(this.field.fieldMatrix); // render first screen without additional logic
  }

  prepareAdditionalLogic() {
    this.field.addPlayer(this.player);
    this.enemyProcessor = this.field.createEnemyProcessor(this);
  }

  reset() {
    this.levelNumber = 0;
    this.player.reset();
    this.progressLevel();
  }

  renderFrame() {
    this.enemyProcessor.removeKilled();
    this.enemyProcessor.moveEnemies(this.levelNumber);

    this.renderScreen(this.field.fieldMatrix);
  }

  progressLevel() {
    this.levelNumber += 1;
    this.field.generateField();
    this.prepareAdditionalLogic();
    // 
    this.renderFrame();
    
    // 
    // if(this.fitTilesToScreen)
    //   this.updateFieldSize();
    // // 
    // this.createField();
    // // //////
    // this.addHealthPotions();
    // this.addSwords();

    // this.addPlayer();
    // this.addEnemies();
    // //
    // this.renderScreen();
  }

  captureRoot() {
    this.fieldRoot = document.getElementsByClassName(this.fieldClass)[0];
    this.inventoryRoot = document.getElementsByClassName(this.inventoryClass)[0];
    this.Log(`got html element as root with class = '${this.fieldClass}'`);
  }
  // ----------------------------
  // game loop

  
  // enemyTick() {
  //   let enemyToMoveList = [...this.enemiesList];
  //   for (let i = 0; i < this.maxEnemyMovePerTick + ~~(this.levelNumber/this.difficultyActiveEnemyPerLevel); i++) {
  //     if (i < this.enemiesList.length) {
  //       let curEnemy = randomChoice(enemyToMoveList);
  //       if (curEnemy !== null) {
  //         this.LogObject(`selected enemy to act (${i+1} of ${this.maxEnemyMovePerTick + ~~(this.levelNumber/this.difficultyActiveEnemyPerLevel)})`, curEnemy, logLevels.full);

  //         var index = enemyToMoveList.indexOf(curEnemy);
  //           if (index !== -1) {
  //             enemyToMoveList.splice(index, 1);
  //           }

  //         let rndX = randomInRange(-1, 2);
  //         let rndY = randomInRange(-1, 2);
  //         this.Log(`enemy will move by ${rndX}(x) ${rndY}(y)`, logLevels.full);

  //         if ((curEnemy.position.minus(this.playerPosition)).length < this.enemySearchRadius) { // semi random direction if in activation radius
  //           var dirVector = curEnemy.position.minus(this.playerPosition).normalizeRound();
  //           rndX = dirVector.x;
  //           rndY = dirVector.y;
  //           this.Log(`player detected, enemy will move by ${rndX}(x) ${rndY}(y)`, logLevels.full);
  //         }

  //         let hasMoved = this.moveTile(curEnemy.position, rndX, rndY);
  //         if (hasMoved) {
  //           this.Log(`enemy move is succesfull`, logLevels.full);
  //           let curPosition = curEnemy.position;
  //           this.enemies[curPosition.x][curPosition.y] = curEnemy; // add cur pos after move
  //           this.enemies[curPosition.x-rndX][curPosition.y-rndY] = null; // remove previous pos after move
  //         }
  //       }
  //     }
  //   }
  // }


  // // game logic
  // spriteLogicCanGo(originalSprite, nextSprite) { // ret true / false
  //   let ret = true;

  //   if (originalSprite === this.tileWall)
  //     ret = false;
  //   if (originalSprite === this.tileBase)
  //     ret = false;
  //   if (nextSprite === this.tileWall)
  //     ret = false;
  //   if (nextSprite === this.tileEnemy)
  //     ret = false;
  //   if (nextSprite === this.tilePlayer)
  //     ret = false;

  //   return ret;
  // }

  // spriteLogicStartLocation(originalSprite, nextSprite) { // ret sprite name
  //   let ret = this.tileBase;
  //   return ret;
  // }
  
  // spriteLogicFinishLocation(originalSprite, nextSprite) { // ret sprite name
  //   let ret = originalSprite;
  //   return ret;
  // }
  // spriteLogicAdditional(originalSprite, nextSprite, originalPos, deltaX, deltaY) { // run needed function
  //   if (originalSprite === this.tilePlayer) {
  //     if (nextSprite === this.tileEnemy) {
  //       this.decreaseHealth(originalPos, deltaX, deltaY);
  //     }
  //     if (nextSprite === this.tileHealthPotion) {
  //       this.increaseHealth();
  //     }
  //     if (nextSprite === this.tileSword) {
  //       this.increaseDamage();
  //     }
  //   }

  //   if (originalSprite === this.tileEnemy) {
  //     if (nextSprite === this.tilePlayer) {
  //       this.decreaseHealth(originalPos, deltaX, deltaY);
  //     }
  //   }
  // }
  // // ----
  // decreaseHealth(originalPos, deltaX, deltaY) {
  //   let damage = 0;

  //   if (this.enemies[originalPos.x][originalPos.y] != null) {
  //     damage = this.enemies[originalPos.x][originalPos.y].damage;
  //   }
  //   if (this.enemies[originalPos.x+deltaX][originalPos.y+deltaY] != null) {
  //     damage = this.enemies[originalPos.x + deltaX][originalPos.y + deltaY].damage;
  //   }

  //   this.Log(`player got hurt by ${damage}`);

  //   this.playerHealth -= damage;
  //   // 
  //   if (this.playerHealth < 0) {
  //     this.Log(`player has died; health = ${this.playerHealth}`);

  //     alert("game over");
  //     this.init();
  //   }
  // }

  // increaseHealth() {
  //   this.Log(`health increased`);
  //   this.playerHealth += this.healthPotionHeal;
  //   if (this.playerHealth > this.maxPlayerHealth) {
  //     this.playerHealth = this.maxPlayerHealth;
  //   }

  // }

  // increaseDamage() {
  //   this.Log(`damage increased`);
  //   this.playerDamage += this.swordDamageIncrease;
  // }
  


  // ----------------------------


  // 



  renderScreen(fieldMatrix) {
    // render field
    this.Log(`removig current fieldRoot childred`, logLevels.full);
    this.fieldRoot.replaceChildren();
    // 
    this.Log(`starting rendering screen`, logLevels.full);
    fieldMatrix.forEach((row, i) => {
      row.forEach((val, j) => {
        var newElement = document.createElement("div");
        // 
        newElement.classList.add(val.tileBaseName);
        if (val.tileName)
          newElement.classList.add(val.tileName);
        
        newElement.style['top'] = `${i * TileBase.tileSize}px`;
        newElement.style['left'] = `${j * TileBase.tileSize}px`;
        // proces health bars
        if (val instanceof Player || val instanceof Enemy) {
          var healthElement = document.createElement("div");
          healthElement.classList.add("health");
          let displayedHealth = val.health;

          healthElement.style['width'] = `${TileBase.tileSize * displayedHealth / 100}px`;
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
    playerHealthElement.innerText = `здоровье: ${this.player.health}/${this.player.maxHealth}`;

    let playerDamageElement = document.createElement("span");
    playerDamageElement.innerText = `Урон: ${this.player.damage}`;

    this.inventoryRoot.appendChild(levelNumberElement);
    this.inventoryRoot.appendChild(playerHealthElement);
    this.inventoryRoot.appendChild(playerDamageElement);
    // 
    this.Log(`finished rendering screen`, logLevels.full);
  }

}