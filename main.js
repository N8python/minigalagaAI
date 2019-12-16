$(init)

function gebi(id) {
    return document.getElementById(id)
}

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min))
}


var canvas;
var ctx;
var width;
var height;
var SHIP_IMAGE;
var YELLOW_BUG;
var BEE;
var PURPLE_BUG;
var BLUE_BUG;
var BOMB;
var BOSS;
var ship;
var movingLeft = false;
var movingRight = false;
var firing = false;
var shipBump;
var bullets;
var cooldown;
var health = 500;
var enemyBullets = [];
var frame = 0;
var enemies = [];
var wave = 1;
var score = 0;
var gameState = "play";
const relu = (x) => x > 0 ? x : 0;
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.xVel = 0;
    }
    draw() {
        ctx.drawImage(SHIP_IMAGE, this.x, this.y)
    }
    move() {
        this.xVel *= 0.9;
        this.x += this.xVel;
    }
    cc() {
        enemyBullets.forEach((bullet) => {
            if (bullet.x >= this.x && bullet.y >= this.y && bullet.x <= this.x + 80 && bullet.y <= this.y + 80 && !bullet.hidden) {
                if (bullet.big) {
                    health -= 2;
                } else if (bullet.bomb) {
                    health -= 3;
                } else {
                    health -= 1;
                }
                bullet.hidden = true;
            }
        })
    }
    prepareInputs() {
        const inputs = [];
        let nearestBullet = enemyBullets.reduce((bullet, t) => {
            if ((this.y - bullet.y) < (this.y - t.y) && bullet.y < this.y && bullet.x >= ship.x && bullet.y <= ship.x + 80) {
                return bullet;
            }
            return t;
        }, {
            x: 10000,
            y: 0,
            marked: true
        });
        if (nearestBullet.marked) {
            inputs.push(0);
        } else {
            inputs.push(relu(Math.min(1, 1 / ((this.y - nearestBullet.y) / 50))));
        }
        const enemy = [0, 0, 0];
        if (!(enemies.length === 0)) {
            if (enemies.some((enemy) => enemy.x >= ship.x && enemy.x <= ship.x + 80)) {
                enemy[0] = 1;
            } else {
                const nearestEnemy = enemies.reduce((enemy, t) => {
                    if (dist(this.x, this.y, enemy.x, enemy.y) < dist(this.x, this.y, t.x, t.y)) {
                        return enemy;
                    }
                    return t;
                }, enemies[0]);
                if (nearestEnemy.x < ship.x) {
                    enemy[1] = 1;
                } else {
                    enemy[2] = 1;
                }
            }
        }
        inputs.push(...enemy);
        inputs.push(Number(firing))
        const dir = [0, 0, 0];
        if (ship.xVel === 0) {
            dir[0] = 1;
        } else if (ship.xVel < 0) {
            dir[1] = 1;
        } else {
            dir[2] = 1;
        }
        inputs.push(...dir);
        inputs.push(Math.min(1 / ((ship.x + 41) / 50), 1))
        inputs.push(Math.min(1 / ((601 - ship.x) / 50), 1))
        return inputs;
    }
}
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hidden = false;
    }
    draw() {
        if (!this.hidden) {
            ctx.fillStyle = "White";
            ctx.fillRect(this.x, this.y, 3, 10)
        }
    }
    move() {
        this.y -= 5;
    }
}

class EnemyBullet extends Bullet {
    constructor(x, y, big = false, bomb = false) {
        super(x, y);
        this.big = big;
        this.bomb = bomb;
    }
    draw() {
        if (!this.hidden) {
            ctx.fillStyle = "Red";
            if (this.big) {
                ctx.fillRect(this.x, this.y, 6, 20)
            } else if (this.bomb) {
                ctx.drawImage(BOMB, this.x, this.y)
            } else {
                ctx.fillRect(this.x, this.y, 3, 10)
            }
        }
    }
    move() {
        if (!this.bomb) {
            this.y += 5;
        } else {
            this.y += 3;
        }
    }
}
class Enemy {
    constructor(x, y, img, hp, shield, lowRange, highRange, score = 1) {
        this.x = x;
        this.y = y;
        this.img = img;
        this.hp = hp;
        this.shield = shield;
        this.maxshield = shield;
        this.fireMod = randInt(lowRange, highRange)
        this.score = score;
    }
    draw() {
        if (this.hp > 0) {
            ctx.drawImage(this.img, this.x, this.y)
            if (this.shield !== 0) {
                ctx.globalAlpha = this.shield / this.maxshield;
                ctx.strokeStyle = "Blue";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(this.x + this.img.width / 2, this.y + this.img.height / 2, this.img.width / 3, 0, Math.PI);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
        if (this.y > width && this.hp > 1) {
            this.y = 0;
            health -= 1;
        }
    }
    cc() {
        if (this.hp > 0) {
            bullets.forEach((bullet) => {
                if (bullet.x >= this.x && bullet.y >= this.y && bullet.x <= this.x + this.img.width && bullet.y <= this.y + this.img.height && !bullet.hidden) {
                    if (this.shield > 0) {
                        this.shield -= 1;
                    } else {
                        this.hp -= 1;
                        if (this.hp < 1) {
                            score += this.score;
                        }
                    }
                    bullet.hidden = true;
                }
            })
        }
    }
}

class YellowBug extends Enemy {
    constructor(x, y) {
        super(x, y, YELLOW_BUG, 3, 0, 150, 300, 3)
    }
    move() {
        this.y += 0.5;
    }
    fire() {
        if (frame % this.fireMod === 0 && this.hp > 0) {
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 2, this.y + this.img.height / 2));
        }
    }
}
class Bee extends Enemy {
    constructor(x, y) {
        super(x, y, BEE, 5, 2, 100, 200, 6)
    }
    move() {
        this.y += 0.5;
    }
    fire() {
        if (frame % this.fireMod === 0 && this.hp > 0) {
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 3, this.y + this.img.height / 2));
            enemyBullets.push(new EnemyBullet(this.x + this.img.width * 2 / 3, this.y + this.img.height / 2));
        }
    }
}

class PurpleBug extends Enemy {
    constructor(x, y) {
        super(x, y, PURPLE_BUG, 6, 4, 80, 160, 15)
        this.sine = randInt(-100, 100)
    }
    move() {
        this.y += 0.5;
        this.x = Math.sin(this.y / 25) * 200 + width / 2 + this.sine;
    }
    fire() {
        if (frame % this.fireMod === 0 && this.hp > 0) {
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 2, this.y + this.img.height / 2, true));
        }
    }
}

class BlueBug extends Enemy {
    constructor(x, y) {
        super(x, y, BLUE_BUG, 4, 10, 120, 240, 30)
    }
    move() {
        this.y += 0.3;
    }
    fire() {
        if (frame % this.fireMod === 0 && this.hp > 0) {
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 2, this.y + this.img.height / 2, false, true));
        }
    }
}

class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, BOSS, 8, 12, 80, 160, 50)
        this.sine = randInt(-150, 150)
    }
    move() {
        this.y += 0.5;
        this.x = Math.sin(this.y / 25) * 200 + width / 2 + this.sine;
    }
    fire() {
        if (frame % this.fireMod === 0 && this.hp > 0) {
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 3, this.y + this.img.height / 2));
            enemyBullets.push(new EnemyBullet(this.x + this.img.width * 2 / 3, this.y + this.img.height / 2));
            enemyBullets.push(new EnemyBullet(this.x + this.img.width / 2, this.y + this.img.height / 2, false, true));
        }
    }
}

function init() {
    $("#startButton").click(start)
    canvas = gebi("canvas");
    ctx = canvas.getContext('2d')
    width = canvas.width;
    height = canvas.height;
    SHIP_IMAGE = gebi("shipImage");
    YELLOW_BUG = gebi("yellowbug");
    BEE = gebi("bee");
    PURPLE_BUG = gebi("purplebug");
    BLUE_BUG = gebi("bluebug");
    BOMB = gebi("bomb");
    BOSS = gebi("boss")
    ship = new Ship(width / 2 - 60, height - 100)
    shipBump = 80;
    bullets = [];
    cooldown = 0;
    ctx.fillStyle = "Black"
    ctx.fillRect(0, 0, width, height)
    ctx.font = "70px monospace";
    ctx.fillStyle = "White";
    ctx.textAlign = "center";
    ctx.fillText("Mini-Galaga", width / 2, height / 2);
    ctx.font = "20px monospace";
    ctx.fillText("The galaga revamp... 2018", width / 2, height / 2 + 75)
}
let alapping = false;

function start() {
    gebi("startButton").remove();
    $(document).on({
        keydown: (event) => {
            if (event.which === 39) {
                movingRight = true;
            } else if (event.which === 37) {
                movingLeft = true;
            }
            if (event.which === 32) {
                firing = true;
            }
            if (event.which === 65) {
                alapping = !alapping;
            }
        },
        keyup: (event) => {
            if (event.which === 39) {
                movingRight = false;
            } else if (event.which === 37) {
                movingLeft = false;
            }
            if (event.which === 32) {
                firing = false;
            }
        },
        click: (event) => {
            if (gameState === "over") {
                reset();
            }
        }
    })
    let champ = gen();
    reset();
    let frames = 2000;
    var game = setInterval(() => {
        frames--;
        if (frames < 1 || alapping) {
            champ = gen();
            reset();
            health = Math.min(5 * generation, 500);
            frames = 2000;
        }
        if (gameState === "play") {
            doAction(champ.feedForward(ship.prepareInputs()));
            ctx.fillStyle = "Black";
            ctx.fillRect(0, 0, width, height)
            ctx.fillStyle = "White"
            ctx.font = "10x Courier"
            ctx.fillText("Health: " + health, 80, 30)
            ctx.fillText("Generation: " + generation, 105, 60)
            ctx.fillText("Score: " + score, width - 80, 30)
            ship.draw();
            bullets.forEach((bullet) => {
                bullet.draw();
            })
            enemyBullets.forEach((bullet, idx) => {
                bullet.draw();
            })
            enemies.forEach((enemy) => {
                enemy.draw();
            });
            let oldScore = score;
            step();
            if (score > oldScore) {
                frames += 500;
            }
        } else if (gameState === "over") {
            champ = gen();
            reset();
            health = Math.min(5 * generation, 500);
            frames = 2000;
            /*ctx.fillStyle = "Black";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "White";
            ctx.font = "60px Courier"
            ctx.fillText("Game Over", width / 2, height / 2)
            ctx.font = "20px Courier"
            ctx.fillText("...for now. Click to play again!", width / 2, height / 2 + 100)
            ctx.fillText("Your Score: " + score, width / 2, height / 2 + 150)*/
        }

    }, 16)
}

function step() {
    if (movingRight) ship.xVel += 1;
    if (movingLeft) ship.xVel -= 1;
    if (ship.x > width - shipBump) ship.x = width - shipBump;
    if (ship.x < -30) ship.x = -30;
    ship.cc();
    ship.move();
    enemies.forEach(enemy => {
        enemy.move();
        enemy.cc();
        enemy.fire();
    })
    bullets.forEach((bullet, idx) => {
        bullet.move();
        if (bullet.y < -50) {
            bullets.splice(idx, 1);
        }
    })
    enemyBullets.forEach((bullet, idx) => {
        bullet.move();
        if (bullet.y > 500) {
            enemyBullets.splice(idx, 1);
        }
    })
    if (firing && cooldown < 1) {
        bullets.push(new Bullet(ship.x + 53, ship.y))
        cooldown = 10;
    }
    if (wave === 1) {
        if (frame === 0) {
            for (var i = 0; i < 4; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 300) {
            for (var i = 0; i < 5; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 2; i++) {
                enemies.push(new Bee(randInt(50, width - 50), 50))
            }
        } else if (frame === 1200) {
            for (var i = 0; i < 4; i++) {
                enemies.push(new Bee(randInt(50, width - 50), 50))
            }
        } else if (frame === 1600) {
            frame = 0;
            wave = 2;
        }
    }
    if (wave === 2) {
        if (frame === 0) {
            for (var i = 0; i < 7; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 200) {
            for (var i = 0; i < 2; i++) {
                enemies.push(new Bee(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 2; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1000) {
            for (var i = 0; i < 7; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 4; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1200) {
            for (var i = 0; i < 7; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1600) {
            frame = 0;
            wave = 3;
        }
    }
    if (wave === 3) {
        if (frame === 0) {
            for (var i = 0; i < 7; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 200) {
            for (var i = 0; i < 3; i++) {
                enemies.push(new BlueBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 2; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1000) {
            for (var i = 0; i < 7; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 4; i++) {
                enemies.push(new BlueBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1200) {
            for (var i = 0; i < 4; i++) {
                enemies.push(new Bee(randInt(50, width - 50), 50))
            }
        } else if (frame === 1600) {
            frame = 0;
            wave = 4;
        }
    }
    if (wave === 4) {
        if (frame === 0) {
            for (var i = 0; i < 10; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 200) {
            enemies.push(new Boss(randInt(50, width - 50), 50))
        } else if (frame === 400) {
            for (var i = 0; i < 4; i++) {
                enemies.push(new BlueBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 4; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1000) {
            enemies.push(new Boss(randInt(50, width - 50), 50))
            enemies.push(new Boss(randInt(50, width - 50), 50))
            for (var i = 0; i < 2; i++) {
                enemies.push(new BlueBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 2; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
            for (var i = 0; i < 10; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        } else if (frame === 1600) {
            wave = 5;
            frame = 0;
        }

    }
    if (wave === 5) {
        if (frame % 400 === 0) {
            for (var i = 0; i < 12; i++) {
                enemies.push(new YellowBug(randInt(50, width - 50), 50))
            }
        }
        if (frame % 600 === 0) {
            for (var i = 0; i < 8; i++) {
                enemies.push(new Bee(randInt(50, width - 50), 50))
            }
        }
        if (frame % 800 === 0) {
            for (var i = 0; i < 6; i++) {
                enemies.push(new PurpleBug(randInt(50, width - 50), 50))
            }
        }
        if (frame % 1000 === 0) {
            for (var i = 0; i < 4; i++) {
                enemies.push(new BlueBug(randInt(50, width - 50), 50))
            }
        }
        if (frame % 1200 === 0) {
            for (var i = 0; i < 2; i++) {
                enemies.push(new Boss(randInt(50, width - 50), 50))
            }
        }
    }
    cooldown -= 1;
    frame++;
    if (bullets.length > 20) {
        bullets.splice(0, 1)
    }
    if (enemyBullets.length > 500) {
        enemyBullets.splice(0, 1)
    }
    if (enemies.length > 100) {
        enemies.splice(0, 1)
    }
    if (health < 1) {
        gameState = "over";
    }
}

function reset() {
    movingLeft = false;
    movingRight = false;
    firing = false;
    bullets = [];
    cooldown = 0;
    health = 5;
    enemyBullets = [];
    frame = 0;
    enemies = [];
    wave = 1;
    score = 0;
    ship.x = width / 2 - 60;
    ship.y = height - 100;
    gameState = "play";
}

function doAction(results) {
    const max = Math.max(...results);
    const choice = results.findIndex(result => result === max);
    console.log(choice);
    if (choice === 0) {
        firing = true;
    }
    if (choice === 1) {
        movingRight = true;
        movingLeft = false;
    }
    if (choice === 2) {
        movingRight = false;
        movingLeft = true;
    }
    return choice;
}