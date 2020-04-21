// @ts-check

// get the main div and canvas ready
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
let context = canvas.getContext("2d");

// create assets
let tankPImg = new Image();
tankPImg.src = 'images/tank_player.png'; // Set source path
let shellImgP = new Image();
shellImgP.src = 'images/shell_player.png';
let apShellImgP = new Image();
apShellImgP.src = 'images/apShell_player.png';
let heShellImgP = new Image();
heShellImgP.src = 'images/heShell_player.png';
let mgBulletImgP = new Image();
mgBulletImgP.src = 'images/mgBullet_player.png';

let tankEImg = new Image();
tankEImg.src = 'images/tank_enemy.png';
let shellImgE = new Image();
shellImgE.src = 'images/shell_enemy.png';

// game settings
let isOver = false;
let isWinning = false;
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
let hpMaxP = 200;
let hpMaxE = 50;
let tankOffset = 15;
let projSpeed = 7;
let minMoveE = 100;

// stats for weapons
let mainWeaponsP = [];
let shellP = {
    type: 'm',
    damage: 10,
    fireRate: 15, // the smaller, the faster
    projSpeed: 7,
    projImg: shellImgP
};
mainWeaponsP.push(shellP);
// armor-piercing shells
let apShell = {
    type: 'm',
    damage: 20,
    fireRate: 30,
    projSpeed: 7,
    projImg: apShellImgP
};
mainWeaponsP.push(apShell);

// High-explosive bombs
let heShell = {
    type: 'm',
    damage: 40,
    fireRate: 50,
    projSpeed: 7,
    projImg: heShellImgP
};
mainWeaponsP.push(heShell);

let secondaryWeaponsP = [];
// machine gun
let machineGunP = {
    type: 's',
    damage: 5,
    fireRate: 5,
    projSpeed: 10,
    projImg: mgBulletImgP
};
secondaryWeaponsP.push(machineGunP);

let mainWeaponsE = [];
let shellE = {
    type: 'm',
    damage: 10,
    fireRate: 15,
    projSpeed: 7,
    projImg: shellImgE
};
mainWeaponsE.push(shellE);

let secondaryWeaponsE = [];
let machineGunE = {
    type: 's',
    damage: 5,
    fireRate: 5,
    projSpeed: 10,
    projImg: shellImgE
};
secondaryWeaponsE.push(machineGunE);

// initial params of player's tank
let tankP;

// enemy parameters
let enemies = [];
let enemySpawns = [];
let enemyNum = 2;

// event listeners for keyboard
window.onkeydown = function (event) {
    event.preventDefault();
    var key = event.keyCode; //Key code of key pressed

    // space
    if (key === 32) {
        if (tankP.fireTimer >= tankP.curWeapon.fireRate) {
            fire(tankP);
            tankP.fireTimer = 0;
        }
    }

    // 1
    if (key === 49) {
        tankP.weaponType = 'm';
    }

    // 2
    if (key === 50) {
        tankP.weaponType = 's';
    }

    // 3
    if (key === 51) {

    }

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
    // drawRefDot(tank.posX, tank.posY);
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

function switchWeapon(tank) {
    let mainWeapons = tank.id.charAt[0] = 'p' ? mainWeaponsP : mainWeaponsE;
    let secondaryWeapons = tank.id.charAt[0] = 'p' ? secondaryWeaponsP : secondaryWeaponsE;
    if (tank.weaponType == 'm') {
        tank.curWeapon = mainWeapons[tank.mWeapon];
    } else {
        tank.curWeapon = secondaryWeapons[tank.sWeapon];
    }
}

function move(tank) {
    if (tank.obstacle * tank.forward > 0) {
        // console.log("Stuck!");
        return;
    }
    // update the orientation
    tank.orient += tank.clockwise * tank.speedR;
    // update the position
    let dirX = Math.sin(tank.orient / 180 * Math.PI);
    let dirY = -Math.cos(tank.orient / 180 * Math.PI);

    if (((tank.posX >= leftBound && dirX * tank.forward <= 0) || (tank.posX <= rightBound && dirX * tank.forward >= 0)) &&
        ((tank.posY >= upperBound && dirY * tank.forward <= 0) || (tank.posY <= lowerBound && dirY * tank.forward >= 0))) {
        tank.posX += dirX * tank.forward * tank.speedM;
        tank.posY += dirY * tank.forward * tank.speedM;
    } else {
        if (tank.id.charAt(0) == 'e') {
            if (tank.posX < leftBound || tank.posX > rightBound) {
                tank.orient = 0 - tank.orient;
            }
            if (tank.posY < upperBound || tank.posY > lowerBound) {
                tank.orient = 180 - tank.orient;
            }
        }
    }
}

function searchForPlayer(tank, tankP) {
    let vec1 = [Math.sin(tank.orient / 180 * Math.PI), -Math.cos(tank.orient / 180 * Math.PI)];
    let vec2 = [tankP.posX - tank.posX, tankP.posY - tank.posY];
    let vec1Mag = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
    let vec2Mag = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
    let angle = Math.acos((vec1[0] * vec2[0] + vec1[1] * vec2[1]) / (vec1Mag * vec2Mag)) / Math.PI * 180;
    let dir = vec1[0] * vec2[1] - vec1[1] * vec2[0];
    dir /= Math.abs(dir); // positive -> right, negative -> left
    // console.log(dir);
    // console.log("Orientation: " + tank.orient + ", Angle: " + angle);
    if (Math.abs(angle) < 1) {
        // console.log("Fire!");
        tank.forward = 0;
        tank.clockwise = 0;
        if (tank.fireTimer >= tank.curWeapon.fireRate) {
            fire(tank);
            tank.fireTimer = 0;
        }
    } else if (Math.abs(angle) < tank.view * 0.5) {
        // console.log("Detected!");
        tank.forward = 0;
        tank.clockwise = dir;
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
        img: tank.curWeapon.projImg
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

function getPolygon(tank, mode) {
    let center = [tank.posX, tank.posY + tankOffset];
    let diagonalHalf = Math.sqrt(Math.pow(tank.img.width * 0.5, 2) + Math.pow(tank.img.height * 0.5 - tankOffset, 2));
    // collision mode
    if (mode == 'c') {
        // center = [tank.posX, tank.posY];
        diagonalHalf = Math.sqrt(Math.pow(tank.img.width * 0.5, 2) + Math.pow(tank.img.height * 0.5, 2));
    }
    let a1 = Math.acos(tank.img.width * 0.5 / diagonalHalf) / Math.PI * 180;
    let pointtl = [-diagonalHalf * Math.cos((a1 + tank.orient) * Math.PI / 180),
        -diagonalHalf * Math.sin((a1 + tank.orient) * Math.PI / 180)
    ];
    let pointtr = [diagonalHalf * Math.cos((a1 - tank.orient) * Math.PI / 180),
        -diagonalHalf * Math.sin((a1 - tank.orient) * Math.PI / 180)
    ];
    let pointbr = [-pointtl[0], -pointtl[1]];
    let pointbl = [-pointtr[0], -pointtr[1]];
    let polygon = [pointtl, pointtr, pointbr, pointbl];
    for (let k = 0; k < polygon.length; k++) {
        let point = polygon[k];
        point[0] += center[0];
        point[1] += center[1];
        if (mode == 'c') {
            point[0] += tankOffset * Math.sin(tank.orient * Math.PI / 180);
            point[1] += -tankOffset * Math.cos(tank.orient * Math.PI / 180);
        }
        // drawRefDot(point[0], point[1]);
    }
    return polygon;
}

// handle skull showing up
// let skull;
// let skullTimer = 0;
// let skullRate = 50;
// handle prompt message
// let scoreMsg;
// let scoreMsgTimer = 0;
// let scoreMsgRate = 50;

function detectCollision() {
    let tanks = enemies.concat([tankP]);
    for (let i = 0; i < tanks.length; i++) {
        let tank = tanks[i];
        // zone of detection
        let polygon = getPolygon(tank, 'c');
        // console.log(polygon);
        search: for (let j = 0; j < tanks.length; j++) {
            if (i == j) continue;
            let tankB = tanks[j];
            let polygonB = getPolygon(tankB, 'c');
            for (let k = 0; k < polygon.length; k++) {
                let point = polygon[k];
                if (inside(point[0], point[1], polygonB)) {
                    //console.log("Collide!");
                    if (k < 2) {
                        tank.obstacle = 1;
                    } else {
                        tank.obstacle = -1;
                    }
                    break search;
                }
                tank.obstacle = 0;
            }
        }
    }
}

function detectHit(tank, enemies) {
    for (let i = 0; i < tank.projectiles.length; i++) {
        let proj = tank.projectiles[i];
        // zone of detection
        for (let j = 0; j < enemies.length; j++) {
            let tankE = enemies[j];
            let polygon = getPolygon(tankE, 'h');
            // console.log(polygon);
            if (inside(proj.x, proj.y, polygon)) {
                // console.log("Hit!");
                tank.projectiles.splice(i, 1);
                i--;

                if (tankE.hp > 0) {
                    tankE.hp -= tank.curWeapon.damage;
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

    // Temporary instructions
    let instructionText = document.createElement("p");
    instructionText.id = "instructionText";
    instructionText.innerHTML = 
        "1. Use up and down arrow keys to move forward and backward;\n" +
        "2. Use left and right arrow keys to turn anti-clockwise and clockwise;\n" + 
        "3. Use 1 and 2 to switch between the main and secondary weapon;\n" + 
        "4. Use space to shoot!";
    startMenu.appendChild(instructionText);

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
        obstacle: 0,
        forward: 0,
        clockwise: 0,
        speedM: 4,
        speedR: 2,
        hp: hpMaxP,
        hpMax: hpMaxP,
        mWeapon: 0,
        sWeapon: 0,
        weaponType: 'm',
        curWeapon: shellP,
        fireTimer: 0,
        projectiles: [],
        img: tankPImg
    };

    for (let i = 0; i < enemyNum; i++) {
        enemySpawns = [leftBound + Math.random() * (rightBound - leftBound),
            upperBound + Math.random() * (lowerBound - upperBound)
        ];
        let enemy = {
            id: "e" + i,
            posX: enemySpawns[0],
            posY: enemySpawns[1],
            orient: Math.random() * 360,
            obstacle: 0,
            forward: 0,
            clockwise: 0,
            speedM: 2,
            speedR: 0.5,
            hp: hpMaxE,
            hpMax: hpMaxE,
            curMove: 0,
            mWeapon: 0,
            sWeapon: 0,
            weaponType: 'm',
            curWeapon: shellE,
            view: 30,
            fireTimer: 0,
            projectiles: [],
            img: tankEImg,
        };
        enemies.push(enemy);
    }

    let clock = 0;
    let offset = Date.now();

    function draw() {
        if (isOver) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        detectCollision();
        ////////// tank section //////////
        enemies.forEach(tankE => {
            if (tankE.hp > 0) {
                drawTank(tankE);
                move(tankE);
                searchForPlayer(tankE, tankP);
                detectHit(tankE, [tankP]);
                tankE.fireTimer++;
            } else {
                let i = enemies.indexOf(tankE);
                enemies.splice(i, 1);
                score += 50;
            }
        });

        drawTank(tankP);
        switchWeapon(tankP);
        move(tankP);
        detectHit(tankP, enemies);
        tankP.fireTimer++;

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
            isWinning = false;
            loadGameOverScene();
        }
        if (enemies.length == 0) {
            isWinning = true;
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
    if (isWinning) {
        gameOverText.innerHTML = "YOU WIN!";
    } else {
        gameOverText.innerHTML = "GAME OVER";
    }
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
