// @ts-check

// get the main div and canvas ready
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
let context = canvas.getContext("2d");

// create assets
let tankPImg = new Image();
tankPImg.src = 'images/tank_player.png'; // Set source path
let tankEImg = new Image();
tankEImg.src = 'images/tank_enemy.png';
let projectileImgP = new Image();
projectileImgP.src = 'images/projectile_player.png';
let projectileImgE = new Image();
projectileImgE.src = 'images/projectile_enemy.png';

// game settings
let isOver = false;
// set bounds
let leftBound = 0.5 * tankPImg.width;
let rightBound = canvas.width - 0.5 * tankPImg.width;
let upperBound = 0.5 * tankPImg.width;
let lowerBound = canvas.height - 0.5 * tankPImg.width;

// UI settings
let score = 0;
let hScore = 0;
let hpBarWidth = 60;
let hpBarHeight = 10;
let buttonW = 250;
let buttonH = 100;

// tank gloal vars
let hpMaxP = 100;
let hpMaxE = 50;
let tankOffset = 15;
let projSpeed = 7;
let minMoveE = 100;

// initial params of player's tank
let tankP = {
    id: "p0",
    posX: 450,
    posY: 300,
    orient: 0,
    forward: 0,
    clockwise: 0,
    speedM: 4,
    speedR: 2,
    hp: hpMaxP,
    hpMax: hpMaxP,
    attack: 10,
    fireTimer: 0,
    fireRate: 15,
    projectiles: [],
    img: tankPImg,
    projImg: projectileImgP
};

// enemy parameters
let enemies = [];
let enemySpawnPosX = 100;
let enemySpawnPosY = 100;
let enemyNum = 1;


// event listeners for keyboard
window.onkeydown = function (event) {
    event.preventDefault();
    var key = event.keyCode; //Key code of key pressed

    // a
    if (key === 65) {
        if (tankP.fireTimer >= tankP.fireRate) {
            fire(tankP);
            tankP.fireTimer = 0;
        }
    }

    // q
    if (key === 81) {}

    // w
    if (key === 87) {}

    // e
    if (key === 69) {}

    // r
    if (key === 82) {}

    // right arrow
    if (key === 39) {
        tankP.clockwise = 1;
    }
    // left arrow
    else if (key === 37) {
        tankP.clockwise = -1;
    }
    // top arrow 
    else if (key === 38) {
        tankP.forward = 1;
    }
    // down arrow
    else if (key === 40) {
        tankP.forward = -1;
    }
    // delete or backspace, for debug use
    else if (key === 8) {
        tankP.hp = 0;
    }
};

window.onkeyup = function (event) {
    // stop moving as soon as any key is up
    tankP.forward = 0;
    tankP.clockwise = 0;
};

function drawTank(tank) {
    // update the orientation
    tank.orient += tank.clockwise * tank.speedR;
    // update the position
    let dirX = Math.sin(tank.orient / 180 * Math.PI);
    let dirY = -Math.cos(tank.orient / 180 * Math.PI);
    if (((tank.posX >= leftBound && dirX * tank.forward <= 0) || (tank.posX <= rightBound && dirX * tank.forward >= 0)) &&
        ((tank.posY >= upperBound && dirY * tank.forward <= 0) || (tank.posY <= lowerBound && dirY * tank.forward >= 0))) {
        tank.posX += dirX * tank.forward * tank.speedM;
        tank.posY += dirY * tank.forward * tank.speedM;
    }
    // draw
    context.save();
    context.translate(tank.posX, tank.posY);
    context.translate(0, tankOffset);
    context.rotate(tank.orient / 180 * Math.PI);
    context.translate(0, -tankOffset);
    context.drawImage(tank.img, -tank.img.width * 0.5, -tank.img.height * 0.5);

    context.translate(-0.5 * hpBarWidth, 0.5 * tank.img.height + 10);
    context.fillStyle = "white";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(hpBarWidth, 0);
    context.lineTo(hpBarWidth, hpBarHeight);
    context.lineTo(0, hpBarHeight);
    context.closePath();
    context.fill();
    let hpRatio = tank.hp / tank.hpMax;
    if (hpRatio > 0.5) {
        context.fillStyle = "blue";
    } else if (hpRatio > 0.25) {
        context.fillStyle = "orange";
    } else {
        context.fillStyle = "red";
    }
    context.fillRect(0, 0, hpRatio * hpBarWidth, hpBarHeight);
    context.stroke();
    context.restore();

    drawProjectiles(tank);
    drawRefDot(tank.posX, tank.posY);
}

function drawProjectiles(tank) {
    for (let i = 0; i < tank.projectiles.length; i++) {
        let proj = tank.projectiles[i];
        context.save();
        if (proj.x >= 0 && proj.x <= canvas.width && proj.y >= 0 && proj.y <= canvas.height) {
            // update the position
            let dirX = Math.sin(proj.a / 180 * Math.PI);
            let dirY = -Math.cos(proj.a / 180 * Math.PI);
            proj.x += dirX * projSpeed;
            proj.y += dirY * projSpeed;
            context.translate(proj.x, proj.y);
            context.rotate(proj.a / 180 * Math.PI);
            context.drawImage(proj.img, -proj.img.width * 0.5, -proj.img.height * 0.5);
        } else {
            tank.projectiles.splice(i, 1);
            i--;
            // console.log(tank.projectiles);
        }
        context.restore();
    }
}

function drawRefDot(posX, posY) {
    context.save();
    context.beginPath();
    context.arc(posX, posY, 5, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function searchForPlayer(tank, tankP) {
    let vec1 = [Math.sin(tank.orient / 180 * Math.PI), -Math.cos(tank.orient / 180 * Math.PI)];
    let vec2 = [tankP.posX - tank.posX, tankP.posY - tank.posY];
    let vec1Mag = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
    let vec2Mag = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
    let angle = Math.acos((vec1[0] * vec2[0] + vec1[1] * vec2[1]) / (vec1Mag * vec2Mag)) / Math.PI * 180;
    // if (vec2[0] < 0) angle = 0 - angle;
    // console.log("Orientation: " + tank.orient + ", Angle: " + angle);
    if (Math.abs(angle) < 1) {
        // console.log("Fire!");
        tank.forward = 0;
        tank.clockwise = 0;
        if (tank.fireTimer >= tank.fireRate) {
            fire(tank);
            tank.fireTimer = 0;
        }
    } else if (Math.abs(angle) < tank.view * 0.5) {
        // console.log("Detected!");
        tank.forward = 0;
        let dir = angle / Math.abs(angle);
        tank.clockwise = 1.5 * dir;
    } else {
        tank.clockwise = 0;
        tank.forward = 1;
    }
}

function fire(tank) {
    let offsetX = Math.sin(tank.orient / 180 * Math.PI) * (tank.img.height * 0.5 + tankOffset);
    let offsetY = -Math.cos(tank.orient / 180 * Math.PI) * (tank.img.height * 0.5 + tankOffset);
    let proj = {
        x: tank.posX + offsetX,
        y: tank.posY + offsetY + tankOffset,
        a: tank.orient,
        img: tank.projImg
    };
    tank.projectiles.push(proj);
}

function inside(x, y, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0],
            yi = vs[i][1];
        let xj = vs[j][0],
            yj = vs[j][1];

        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// handle skull showing up
// let skull;
// let skullTimer = 0;
// let skullRate = 50;
// handle prompt message
// let scoreMsg;
// let scoreMsgTimer = 0;
// let scoreMsgRate = 50;

function detectHit(tank, enemies) {
    for (let i = 0; i < tank.projectiles.length; i++) {
        let proj = tank.projectiles[i];
        // zone of detection
        for (let j = 0; j < enemies.length; j++) {
            let tankE = enemies[j];
            let center = [tankE.posX, tankE.posY + tankOffset];
            let diagonalHalf = Math.sqrt(Math.pow(tankE.img.width * 0.5, 2) + Math.pow(tankE.img.height * 0.5 - tankOffset, 2));
            let pointtr = [diagonalHalf * Math.cos((45 - tankE.orient) * Math.PI / 180),
                -diagonalHalf * Math.sin((45 - tankE.orient) * Math.PI / 180)
            ];
            let pointbr = [diagonalHalf * Math.cos((45 + tankE.orient) * Math.PI / 180),
                diagonalHalf * Math.sin((45 + tankE.orient) * Math.PI / 180)
            ];
            let pointbl = [-pointtr[0], -pointtr[1]];
            let pointtl = [-pointbr[0], -pointbr[1]];
            let polygon = [pointtr, pointbr, pointbl, pointtl];
            for (let k = 0; k < polygon.length; k++) {
                let point = polygon[k];
                point[0] += center[0];
                point[1] += center[1];
                drawRefDot(point[0], point[1]);
            }
            // console.log(polygon);
            if (inside(proj.x, proj.y, polygon)) {
                console.log("Hit!");
                tank.projectiles.splice(i, 1);
                i--;

                if (tankE.hp > 0) {
                    tankE.hp -= tank.attack;
                }
            }
        }
    }
}

function removeUI() {
    // remove UI elements
    let UIs = document.getElementsByClassName('UI');
    while (UIs[0])
        UIs[0].parentNode.removeChild(UIs[0]);
}


function loadMenuScene() {
    removeUI();

    let startMenu = document.createElement("div");
    startMenu.className = "menu UI";

    // Create Buttons
    let startButton = document.createElement("button");
    startButton.id = "startButton";
    startButton.className = "rectButton";
    startButton.style.left = (0.5 * (canvas.width - buttonW)).toString() + "px";
    startButton.style.top = (0.5 * (canvas.height - buttonH)).toString() + "px";
    startButton.innerHTML = "START";
    startButton.onclick = loadGameScene;
    startMenu.appendChild(startButton);

    div.appendChild(startMenu);
}

function loadGameScene() {
    // remove UI elements
    removeUI();

    // reset some global variables
    isOver = false;
    score = 0;

    enemies = [];

    // reset the position of player's tank
    tankP = {
        id: "p0",
        posX: 450,
        posY: 300,
        orient: 0,
        forward: 0,
        clockwise: 0,
        speedM: 4,
        speedR: 2,
        hp: hpMaxP,
        hpMax: hpMaxP,
        attack: 10,
        fireTimer: 0,
        fireRate: 15,
        projectiles: [],
        img: tankPImg,
        projImg: projectileImgP
    };

    for (let i = 0; i < enemyNum; i++) {
        let enemy = {
            id: "e" + i,
            posX: enemySpawnPosX,
            posY: enemySpawnPosY,
            orient: 90,
            forward: 0,
            clockwise: 0,
            speedM: 2,
            speedR: 0.5,
            hp: hpMaxE,
            hpMax: hpMaxE,
            attack: 5,
            curMove: 0,
            view: 60,
            fireTimer: 0,
            fireRate: 15,
            projectiles: [],
            img: tankEImg,
            projImg: projectileImgE
        };
        enemies.push(enemy);
    }

    let clock = 0;
    let offset = Date.now();

    function draw() {
        if (isOver) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        ////////// tank section //////////
        drawTank(tankP);
        tankP.fireTimer++;
        detectHit(tankP, enemies);

        enemies.forEach(tankE => {
            if (tankE.hp > 0) {
                drawTank(tankE);
                tankE.fireTimer++;
                searchForPlayer(tankE, tankP);
                detectHit(tankE, [tankP]);
            } else {
                let i = enemies.indexOf(tankE);
                enemies.splice(i, 1);
            }
        });

        // draw the skull if hit
        // if (skull) {
        //     if (skullTimer < skullRate) {
        //         let skullImg = new Image();
        //         skullImg.src = "images/skull.png";
        //         context.drawImage(skullImg, skull.posX - 0.5 * skullImg.width,
        //             skull.posY - 0.5 * skullImg.height);
        //         skullTimer++;
        //     } else {
        //         skull = null;
        //         skullTimer = 0;
        //     }
        // }

        ////////// UI section //////////
        // update highest score
        if (score > hScore) hScore = score;
        // draw texts
        context.save();
        context.fillStyle = "black";
        context.font = "16px Georgia";
        context.fillText("Score: " + score, 60, 40);
        context.fillText("Highest score: " + hScore, 180, 40);
        // context.fillText("Energy remaining: " + hp, 110, 70);

        // if (scoreMsg) {
        //     if (scoreMsgTimer < scoreMsgRate) {
        //         context.fillText(scoreMsg, 300, 70);
        //         scoreMsgTimer++;
        //     } else {
        //         scoreMsg = null;
        //         scoreMsgTimer = 0;
        //     }
        // }

        clock += (Date.now() - offset) / 1000;
        let second = Math.floor(clock % 60).toString();
        if ((Number(second) < 10)) second = '0' + second;
        let minute = Math.floor(clock / 60).toString();
        if ((Number(minute) < 10)) minute = '0' + minute;
        // console.log(second);
        context.fillText("Time: " + minute + " : " + second, 700, 40);
        offset = Date.now();
        context.restore();
        // update hp and energy bar
        if (tankP.hp <= 0) {
            loadGameOverScene();
        }

        context.restore();
        window.requestAnimationFrame(draw);
    }
    draw();
}

function loadGameOverScene() {
    removeUI();

    isOver = true;

    context.clearRect(0, 0, canvas.width, canvas.height);

    let gameOverMenu = document.createElement("div");
    gameOverMenu.className = "menu UI";

    let gameOverText = document.createElement("p");
    gameOverText.id = "gameOverText";
    gameOverText.innerHTML = "GAME OVER";
    gameOverMenu.appendChild(gameOverText);

    let scoreText = document.createElement("p");
    scoreText.id = "scoreText";
    scoreText.innerHTML = "Score: " + score;
    gameOverMenu.appendChild(scoreText);

    let tryAgainButton = document.createElement("button");
    tryAgainButton.id = "tryAgainButton";
    tryAgainButton.className = "rectButton";
    tryAgainButton.innerHTML = "TRY AGAIN";
    tryAgainButton.style.marginBottom = "50px";
    tryAgainButton.onclick = loadGameScene;
    gameOverMenu.appendChild(tryAgainButton);

    let quitButton = document.createElement("button");
    quitButton.id = "quitButton";
    quitButton.className = "rectButton";
    quitButton.innerHTML = "QUIT";
    quitButton.style.marginBottom = "50px";
    quitButton.onclick = loadMenuScene;
    gameOverMenu.appendChild(quitButton);

    div.appendChild(gameOverMenu);
}

window.onload = function () {
    let audioButton = document.createElement("button");
    audioButton.id = "audioButton";
    audioButton.style.backgroundImage = "url('images/audio.png')";

    let audio = /** @type {HTMLAudioElement} */ (document.getElementById("music"));
    // audio.play();
    audioButton.onclick = function () {
        if (audio.muted) {
            audio.muted = false;
            audioButton.style.backgroundImage = "url('images/audio.png')";
        } else {
            audio.muted = true;
            audioButton.style.backgroundImage = "url('images/mute.png')";
        }
    };
    div.appendChild(audioButton);
    loadMenuScene();
};