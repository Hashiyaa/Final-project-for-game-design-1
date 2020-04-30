// @ts-check

import {
    TankE,
    TankP
} from "./tank.js";

// get the main div and canvas ready
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
let context = canvas.getContext("2d");

//////////////////// assets ////////////////////
let bgm = new Audio("sound/starsWar.mp3");
let bgmPlayed = false;
bgm.loop = true;
let clickAudio = new Audio("sound/click.wav");
let toggleOnAudio = new Audio("sound/toggleOn.wav");
let toggleOffAudio = new Audio("sound/toggleOff.wav");

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
let mapImg = new Image();
mapImg.src = 'images/map.png';
let miniMapImg = new Image();
miniMapImg.src = "images/mapMini.png";
let heartImg = new Image();
heartImg.src = 'images/heart.png';
let heartEmptyImg = new Image();
heartEmptyImg.src = 'images/heartEmpty.png';

let tankEImg = new Image();
tankEImg.src = 'images/tank_enemy.png';
let shellImgE = new Image();
shellImgE.src = 'images/shell_enemy.png';

//////////////////// game world settings ////////////////////
let myWorld = {
    minX: 0,
    maxX: 1800,
    minY: 0,
    maxY: 1800,
    mapRadius: 850
};
let obsX1 = 800;
let obsY1 = 570;
let obsX2 = 840;
let obsY2 = 660;
let obs3 = 660;
let obstacles = [
    [
        [obsX1, obsY1],
        [obsX2, obsY2],
        [obsY2, obsX2],
        [obsY1, obsX1],
        [obs3, obs3]
    ],
    [
        [myWorld.maxX - obsX1, obsY1],
        [myWorld.maxX - obsX2, obsY2],
        [myWorld.maxX - obsY2, obsX2],
        [myWorld.maxX - obsY1, obsX1],
        [myWorld.maxX - obs3, obs3]
    ],
    [
        [obsX1, myWorld.maxY - obsY1],
        [obsX2, myWorld.maxY - obsY2],
        [obsY2, myWorld.maxY - obsX2],
        [obsY1, myWorld.maxY - obsX1],
        [obs3, myWorld.maxY - obs3]
    ],
    [
        [myWorld.maxX - obsX1, myWorld.maxY - obsY1],
        [myWorld.maxX - obsX2, myWorld.maxY - obsY2],
        [myWorld.maxX - obsY2, myWorld.maxY - obsX2],
        [myWorld.maxX - obsY1, myWorld.maxY - obsX1],
        [myWorld.maxX - obs3, myWorld.maxY - obs3]
    ]
];

let myCamera;

//////////////////// weapon settings ////////////////////
let mainWeaponsP = [];
let shellP = {
    type: 'm',
    damage: 20,
    fireRate: 100, // the smaller, the faster
    projSpeed: 10,
    projImg: shellImgP
};
mainWeaponsP.push(shellP);
// armor-piercing shells
let apShell = {
    type: 'm',
    damage: 50,
    fireRate: 150,
    projSpeed: 12,
    projImg: apShellImgP
};
mainWeaponsP.push(apShell);
// High-explosive bombs
let heShell = {
    type: 'm',
    damage: 40,
    fireRate: 200,
    projSpeed: 10,
    projImg: heShellImgP
};
mainWeaponsP.push(heShell);

// let secondaryWeaponsP = [];
// // machine gun
// let machineGunP = {
//     type: 's',
//     damage: 1,
//     fireRate: 7,
//     projSpeed: 30,
//     projImg: mgBulletImgP
// };
// secondaryWeaponsP.push(machineGunP);

let mainWeaponsE = [];
let shellE = {
    type: 'm',
    damage: 20,
    fireRate: 120,
    projSpeed: 9,
    projImg: shellImgE
};
mainWeaponsE.push(shellE);

// armor-piercing shells
let apShellE = {
    type: 'm',
    damage: 50,
    fireRate: 160,
    projSpeed: 11,
    projImg: apShellImgP
};
mainWeaponsE.push(apShellE);

// share with tank.js
export {
    myWorld,
    obstacles,
    mainWeaponsP,
    // secondaryWeaponsP,
    mainWeaponsE
};

//////////////////// game status and UI settings ////////////////////
let isOver = false;
let isWinning = false;
let curScene;

// UI settings
let score = 0;
let bonusScore = 0;
let hScore = 0;
let hpBarWidth = 60;
let hpBarHeight = 10;
let buttonW = 250;
let buttonH = 100;

//////////////////// player's tank settings ////////////////////
let tankP;

let lifeNum;
let hpMaxP;
let speedMP;
let speedRP;
let mainWeaponTypeP;

let tankOffset = 15;

//////////////////// enemy tank settings ////////////////////
let enemies = [];

let enemyNum;
let hpMaxE;
let speedME;
let speedRE;
let viewE;
let mainWeaponTypeE;

// spawning points
let spawnOffset = 400;
let enemySpawnsPreset = [{
    x: spawnOffset,
    y: spawnOffset,
}, {
    x: spawnOffset * 2,
    y: spawnOffset / 2,
}, {
    x: myWorld.maxX - spawnOffset,
    y: spawnOffset,
}, {
    x: myWorld.maxX - spawnOffset / 2,
    y: spawnOffset * 2,
}, {
    x: myWorld.maxX - spawnOffset,
    y: myWorld.maxY - spawnOffset,
}, {
    x: spawnOffset * 2,
    y: myWorld.maxY - spawnOffset / 2,
}, {
    x: spawnOffset,
    y: myWorld.maxY - spawnOffset,
}, {
    x: spawnOffset / 2,
    y: spawnOffset * 2,
}];

// event listeners for keyboard
window.onkeydown = function (event) {
    if (curScene == "game") {
        event.preventDefault();
        var key = event.keyCode; //Key code of key pressed

        // space
        if (key === 32) {
            if (tankP.fireTimer >= tankP.curWeapon.fireRate) {
                tankP.fire();
                tankP.fireTimer = 0;
            }
        }

        // // 1
        // if (key === 49) {
        //     tankP.weaponType = 'm';
        // }

        // // 2
        // if (key === 50) {
        //     tankP.weaponType = 's';
        // }

        // // 3
        // if (key === 51) {

        // }

        if (tankP.forward == 0) {
            // right arrow
            if (key === 39) {
                tankP.clockwise = 1;
            }
            // left arrow
            if (key === 37) {
                tankP.clockwise = -1;
            }
        }

        if (tankP.clockwise == 0) {
            // top arrow 
            if (key === 38) {
                tankP.forward = 1;
            }
            // down arrow
            if (key === 40) {
                tankP.forward = -1;
            }
        }

        // delete or backspace, for debug use
        if (key === 8) {
            tankP.hp = 0;
        }
    }
};

window.onkeyup = function (event) {
    if (curScene == "game") {
        // stop moving as soon as any key is up
        tankP.forward = 0;
        tankP.clockwise = 0;
    }
};

function drawTank(tank) {
    // draw
    context.save();
    context.translate(tank.posX, tank.posY);
    context.translate(0, tankOffset);
    context.rotate(tank.orient / 180 * Math.PI);
    context.translate(0, -tankOffset);
    context.drawImage(tank.img, -tank.img.width * 0.5, -tank.img.height * 0.5);
    // hp bar
    context.translate(-0.5 * hpBarWidth, 0.5 * tank.img.height + 10);
    context.fillStyle = "white";
    context.fillRect(0, 0, hpBarWidth, hpBarHeight);
    let hpRatio = tank.hp / tank.hpMax;
    if (hpRatio > 0.5) {
        context.fillStyle = "blue";
    } else if (hpRatio > 0.25) {
        context.fillStyle = "orange";
    } else {
        context.fillStyle = "red";
    }
    context.fillRect(0, 0, hpRatio * hpBarWidth, hpBarHeight);
    context.strokeRect(0, 0, hpBarWidth, hpBarHeight);
    // energy bar
    context.translate(0, hpBarHeight);
    context.fillStyle = "white";
    context.fillRect(0, 0, hpBarWidth, hpBarHeight);
    let fireRatio = Math.min(tank.fireTimer / tank.curWeapon.fireRate, 1);
    context.fillStyle = "green";
    context.fillRect(0, 0, fireRatio * hpBarWidth, hpBarHeight);
    context.strokeRect(0, 0, hpBarWidth, hpBarHeight);
    context.restore();

    drawProjectiles(tank);
    drawRefDot(tank.posX, tank.posY);
}

function drawProjectiles(tank) {
    for (let i = 0; i < tank.projectiles.length; i++) {
        let proj = tank.projectiles[i];
        context.save();
        let dis = Math.sqrt(Math.pow(proj.x - myWorld.maxX / 2, 2) + Math.pow(proj.y - myWorld.maxY / 2, 2));
        if (dis < myWorld.mapRadius) {
            // update the position
            let dirX = Math.sin(proj.a / 180 * Math.PI);
            let dirY = -Math.cos(proj.a / 180 * Math.PI);
            proj.x += dirX * proj.speed;
            proj.y += dirY * proj.speed;
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

function drawMiniMap() {
    context.save();
    context.translate(canvas.width - miniMapImg.width - 10, canvas.height - miniMapImg.height - 10);
    context.drawImage(miniMapImg, 0, 0);
    let ratio = [miniMapImg.width / myWorld.maxX, miniMapImg.height / myWorld.maxY];
    context.fillStyle = "blue";
    context.strokeStyle = "blue";
    context.lineWidth = 3;
    context.beginPath();
    let centerP = [ratio[0] * tankP.posX, ratio[1] * tankP.posY];
    context.arc(centerP[0], centerP[1], 4, 0, Math.PI * 2);
    context.moveTo(centerP[0], centerP[1]);
    context.lineTo(10 * Math.sin(tankP.orient / 180 * Math.PI) + centerP[0], -10 * Math.cos(tankP.orient / 180 * Math.PI) + centerP[1]);
    context.fill();
    context.stroke();

    context.fillStyle = "red";
    context.strokeStyle = "red";
    for (let i = 0; i < enemies.length; i++) {
        context.beginPath();
        let centerE = [ratio[0] * enemies[i].posX, ratio[1] * enemies[i].posY];
        context.arc(centerE[0], centerE[1], 3, 0, Math.PI * 2);
        // context.moveTo(centerE[0], centerE[1]);
        // context.lineTo(8 * Math.sin(enemies[i].orient / 180 * Math.PI) + centerE[0], -8 * Math.cos(enemies[i].orient / 180 * Math.PI) + centerE[1]);
        context.fill();
        context.stroke();
    }
    
    context.restore();
}

function drawRefDot(posX, posY) {
    context.save();
    context.beginPath();
    context.arc(posX, posY, 5, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function drawRefPolygon(polygon) {
    context.save();
    context.beginPath();
    context.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i][0], polygon[i][1]);
    }
    context.closePath();
    context.stroke();
    context.restore();
}

function removeUI() {
    // remove UI elements
    let UIs = document.getElementsByClassName('UI');
    while (UIs[0])
        UIs[0].parentNode.removeChild(UIs[0]);
}

function loadMenuScene() {
    curScene = "menu";

    removeUI();

    context.clearRect(0, 0, canvas.width, canvas.height);

    bgm.volume = 0.6;

    let startMenu = document.createElement("div");
    startMenu.className = "menu UI";

    let title = document.createElement("p");
    title.className = "header";
    title.innerHTML = "Tank Expert";
    title.style.fontSize = "70px";
    title.style.paddingTop = "20px";
    startMenu.appendChild(title);

    // Create Buttons
    let startButton = document.createElement("button");
    startButton.id = "startButton";
    startButton.className = "rectButton";
    startButton.style.left = (0.5 * (canvas.width - buttonW)).toString() + "px";
    startButton.style.top = (0.5 * (canvas.height - buttonH)).toString() + "px";
    startButton.innerHTML = "START";
    startButton.onclick = function() {
        clickAudio.play();
        clickAudio.currentTime = 0;
        loadTagScene();
    };
    startMenu.appendChild(startButton);

    // Temporary instructions
    let instructionText = document.createElement("p");
    instructionText.id = "instructionText";
    instructionText.innerHTML =
        "1. Press up and down arrow keys to move forward and backward;\n" +
        "2. Press left and right arrow keys to turn anti-clockwise and clockwise;\n" +
        // "3. Press 1 and 2 to switch between the main and secondary weapon;\n" +
        "3. Press space to shoot!";
    startMenu.appendChild(instructionText);

    div.appendChild(startMenu);
}

function setTankParams() {
    lifeNum = 1;
    hpMaxP = 400;
    speedMP = 4;
    speedRP = 2;
    mainWeaponTypeP = 0;

    enemyNum = 1;
    hpMaxE = 60;
    speedME = 2;
    speedRE = 1;
    viewE = 45;
    mainWeaponTypeE = 0;
}

function addToggleHandler(checkbox, scoreLabel, bonusLabel, point, mode) {
    checkbox.onchange = function () {
        
        if (checkbox.checked) {
            toggleOnAudio.play();
            toggleOnAudio.currentTime = 0;
            scoreLabel.style.display = "inline";
            if (mode == 'e') {
                bonusScore += point * enemyNum;
            } else {
                bonusScore -= point * lifeNum;
            }
        } else {
            toggleOffAudio.play();
            toggleOffAudio.currentTime = 0;
            scoreLabel.style.display = "none";
            if (mode == 'e') {
                bonusScore -= point * enemyNum;
            } else {
                bonusScore += point * lifeNum;
            }
        }
        bonusLabel.innerHTML = "Bonus points: " + bonusScore;
    };
}

function loadTagScene() {
    curScene = "tag";

    removeUI();

    // reset bonus score
    bonusScore = 0;
    setTankParams();

    let tagMenu = document.createElement("div");
    tagMenu.className = "menu UI";

    let header = document.createElement("p");
    header.id = "tagHeader";
    header.className = "header";
    header.innerHTML = "Configure the tanks and win bonus points!";
    header.style.fontSize = "35px";
    tagMenu.appendChild(header);

    let tagList = document.createElement("div");
    tagList.id = "tagListContainer";
    tagList.className = "menu";
    tagList.style.position = "relative";
    tagList.style.height = "300px";
    tagList.style.flexDirection = "row";
    tagMenu.appendChild(tagList);

    let bonusLabel = document.createElement("div");
    bonusLabel.id = "bonusLabel";
    bonusLabel.innerHTML = "Bonus points: " + bonusScore;

    let enemyTagList = document.createElement("div");
    enemyTagList.id = "tagLeftList";
    enemyTagList.className = "tagList";
    tagList.appendChild(enemyTagList);

    let enemyNumSelect = document.createElement("select");
    enemyNumSelect.id = "enemyNumSelect";
    enemyNumSelect.className = "select";
    let values = [1, 2, 3, 4, 5, 6, 7, 8];
    values.forEach(function (number) {
        let opt = document.createElement("option");
        opt.value = number.toString();
        opt.text = number.toString() + " Enemy Tank";
        if (number > 1) opt.text += "s";
        enemyNumSelect.add(opt);
    });
    enemyTagList.appendChild(enemyNumSelect);

    let enemyTags = [{
            name: "hpE",
            cond: "Enemies' health points * 2",
            point: 50
        },
        {
            name: "speedME",
            cond: "Enemies' Movement Speed * 2",
            point: 50
        },
        {
            name: "speedRE",
            cond: "Enemies' Rotation Speed * 2",
            point: 50
        },
        {
            name: "viewE",
            cond: "Enemies' range of view * 2",
            point: 50
        },
        {
            name: "shellE",
            cond: "Enemies use armor-piercing shells",
            point: 50
        }
    ];
    let checkboxesE = [];
    let scoreLabelsE = [];
    for (let i = 0; i < enemyTags.length; i++) {
        let name = enemyTags[i].name + "Toggle";
        let enemyTag = document.createElement("div");
        enemyTag.className = "tag";
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = name;
        checkbox.className = "tagToggle";
        enemyTag.appendChild(checkbox);
        checkboxesE.push(checkbox);
        let label = document.createElement("label");
        label.className = "tagLabel";
        label.htmlFor = name;
        label.innerHTML = enemyTags[i].cond;
        enemyTag.appendChild(label);
        let scoreLabel = document.createElement("label");
        scoreLabel.className = "tagLabel";
        scoreLabel.htmlFor = name;
        scoreLabel.innerHTML = "+ " + enemyTags[i].point + " points * " + enemyNumSelect.value;
        scoreLabel.style.display = "none";
        scoreLabelsE.push(scoreLabel);
        enemyTag.appendChild(scoreLabel);
        addToggleHandler(checkbox, scoreLabel, bonusLabel, enemyTags[i].point, 'e');
        enemyTagList.appendChild(enemyTag);
    }

    enemyNumSelect.onchange = function () {
        toggleOnAudio.play();
        toggleOnAudio.currentTime = 0;
        let sum = 0;
        for (let i = 0; i < scoreLabelsE.length; i++) {
            scoreLabelsE[i].innerHTML = "+ " + enemyTags[i].point + " points * " + enemyNumSelect.value;
            if (scoreLabelsE[i].style.display != "none") {
                sum += enemyTags[i].point;
            }
        }
        bonusScore -= sum * (enemyNum - Number(enemyNumSelect.value));
        bonusLabel.innerHTML = "Bonus points: " + bonusScore;
        enemyNum = Number(enemyNumSelect.value);
    };

    let playerTagList = document.createElement("div");
    playerTagList.id = "tagRightList";
    playerTagList.className = "tagList";
    tagList.appendChild(playerTagList);

    let lifeNumSelect = document.createElement("select");
    lifeNumSelect.id = "enemyNumSelect";
    lifeNumSelect.className = "select";
    let lifeValues = [1, 2, 3, 4, 5];
    lifeValues.forEach(function (number) {
        let opt = document.createElement("option");
        opt.value = number.toString();
        opt.text = number.toString() + " Lives";
        if (number == 1) opt.text = "1 Life";
        lifeNumSelect.add(opt);
    });
    playerTagList.appendChild(lifeNumSelect);

    let playerTags = [{
            name: "hpP",
            cond: "Player's health points * 2",
            point: 150
        },
        {
            name: "speedMP",
            cond: "Player's Movement Speed * 2",
            point: 100
        },
        {
            name: "speedRP",
            cond: "Player's Rotation Speed * 2",
            point: 100
        },
        {
            name: "shellP",
            cond: "Player uses armor-piercing shells",
            point: 150
        }
    ];
    let checkboxesP = [];
    let scoreLabelsP = [];
    for (let i = 0; i < playerTags.length; i++) {
        let name = playerTags[i].name + "Toggle";
        let playerTag = document.createElement("div");
        playerTag.className = "tag";
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = name;
        checkbox.className = "tagToggle";
        playerTag.appendChild(checkbox);
        checkboxesP.push(checkbox);
        let label = document.createElement("label");
        label.className = "tagLabel";
        label.htmlFor = name;
        label.innerHTML = playerTags[i].cond;
        playerTag.appendChild(label);
        let scoreLabel = document.createElement("label");
        scoreLabel.className = "tagLabel";
        scoreLabel.htmlFor = name;
        scoreLabel.innerHTML = "- " + playerTags[i].point + " points";
        scoreLabel.style.display = "none";
        scoreLabelsP.push(scoreLabel);
        playerTag.appendChild(scoreLabel);
        addToggleHandler(checkbox, scoreLabel, bonusLabel, playerTags[i].point, 'p');
        playerTagList.appendChild(playerTag);
    }

    lifeNumSelect.onchange = function () {
        toggleOnAudio.play();
        toggleOnAudio.currentTime = 0;
        let sum = 0;
        for (let i = 0; i < scoreLabelsP.length; i++) {
            scoreLabelsP[i].innerHTML = "- " + playerTags[i].point + " points * " + lifeNumSelect.value;
            if (scoreLabelsP[i].style.display != "none") {
                sum -= playerTags[i].point;
            }
        }
        bonusScore -= sum * (lifeNum - Number(lifeNumSelect.value));
        bonusLabel.innerHTML = "Bonus points: " + bonusScore;
        lifeNum = Number(lifeNumSelect.value);
    };

    tagMenu.appendChild(bonusLabel);

    let buttonPanel = document.createElement("div");
    buttonPanel.className = "menu";
    buttonPanel.style.position = "relative";
    buttonPanel.style.height = "150px";
    buttonPanel.style.flexDirection = "row";
    tagMenu.appendChild(buttonPanel);

    let backButton = document.createElement("button");
    backButton.id = "backButton";
    backButton.className = "rectButton";
    backButton.innerHTML = "BACK";
    backButton.style.marginLeft = "50px";
    backButton.onclick = function() {
        clickAudio.play();
        clickAudio.currentTime = 0;
        loadMenuScene();
    };
    buttonPanel.appendChild(backButton);

    let goButton = document.createElement("button");
    goButton.id = "goButton";
    goButton.className = "rectButton";
    goButton.innerHTML = "GO!";
    goButton.style.marginRight = "50px";
    goButton.onclick = function () {
        clickAudio.play();
        clickAudio.currentTime = 0;
        for (let i = 0; i < checkboxesE.length; i++) {
            if (checkboxesE[i].checked) {
                if (i == 0) {
                    hpMaxE *= 2;
                } else if (i == 1) {
                    speedME *= 2;
                } else if (i == 2) {
                    speedRE *= 2;
                } else if (i == 3) {
                    viewE *= 2;
                } else if (i == 4) {
                    mainWeaponTypeE = 1;
                }
            }
        }
        for (let i = 0; i < checkboxesP.length; i++) {
            if (checkboxesP[i].checked) {
                if (i == 0) {
                    hpMaxP *= 2;
                } else if (i == 1) {
                    speedMP *= 2;
                } else if (i == 2) {
                    speedRP *= 2;
                } else if (i == 3) {
                    mainWeaponTypeP = 1;
                }
            }
        }
        loadGameScene();
    };
    buttonPanel.appendChild(goButton);

    div.appendChild(tagMenu);
}

// clamp helper function
function clamp(value, min, max) {
    if (value < min) return min;
    else if (value > max) return max;
    return value;
}

function loadGameScene() {
    curScene = "game";

    // remove UI elements
    removeUI();

    // reset the game status
    isOver = false;
    isWinning = false;
    score = 0;

    // empty the enemies array
    enemies = [];
    let enemySpawns = [...enemySpawnsPreset];

    // reset the position of player's tank
    tankP = new TankP("p0", lifeNum, 900, 900, 0, 0, 0, 0, speedMP, speedRP, hpMaxP, hpMaxP, mainWeaponTypeP, 0, mainWeaponsP[mainWeaponTypeP], 0, [], 0, tankPImg, tankOffset);

    for (let i = 0; i < enemyNum; i++) {
        let randPos = Math.floor(Math.random() * enemySpawns.length);
        let randO = (i % enemyNum) * 90 + 45 + 45 * Math.random();
        let enemy = new TankE("e" + i, enemySpawns[randPos].x, enemySpawns[randPos].y, randO, 0, 0, 0, speedME, speedRE, -1, hpMaxE, hpMaxE, viewE, mainWeaponTypeE, 0, mainWeaponsE[mainWeaponTypeE], 0, [], 0, tankEImg, tankOffset);
        enemies.push(enemy);
        enemySpawns.splice(randPos, 1);
    }

    let clock = 0;
    let offset = Date.now();

    function draw() {
        if (isOver) return;

        bgm.volume = 0.3;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        myCamera = {
            x: clamp(tankP.posX - canvas.width / 2, myWorld.minX, myWorld.maxX - canvas.width),
            y: clamp(tankP.posY - canvas.height / 2, myWorld.minY, myWorld.maxY - canvas.height)
        };
        // console.log("CamX: " + camX + ", CamY: " + camY);
        context.translate(-myCamera.x, -myCamera.y);

        context.drawImage(mapImg, 0, 0);

        ////////// tank section //////////
        enemies.forEach(tankE => {
            if (tankE.hp > 0) {
                drawTank(tankE);
                tankE.searchForPlayer(tankP);
                tankE.detectCollision(tankP);
                tankE.detectHit([tankP]);
                tankE.move();
                tankE.fireTimer++;
            } else {
                let i = enemies.indexOf(tankE);
                enemies.splice(i, 1);
                score += 100;
            }
        });

        drawTank(tankP);
        // tankP.switchWeapon();
        tankP.detectCollision(enemies);
        tankP.detectHit(enemies);
        tankP.move();
        tankP.fireTimer++;

        ////////// UI section //////////
        // update highest score
        // draw texts
        context.save();
        context.fillStyle = "white";
        context.font = "16px Georgia";
        context.translate(myCamera.x, myCamera.y);
        context.fillText("Score: " + score, 60, 40);
        context.fillText("Highest score: " + hScore, 180, 40);
        context.fillText("Lives: ", 60, 70);
        for (let i = 0; i < lifeNum; i++) {
            if (i < tankP.lifeNum) {
                context.drawImage(heartImg, 115 + 25 * i, 55);
            } else {
                context.drawImage(heartEmptyImg, 115 + 25 * i, 55);
            }
        }
        context.fillText("Enemy remaining: " + enemies.length, 60, 100);

        clock += (Date.now() - offset) / 1000;
        let second = Math.floor(clock % 60).toString();
        if ((Number(second) < 10)) second = '0' + second;
        let minute = Math.floor(clock / 60).toString();
        if ((Number(minute) < 10)) minute = '0' + minute;
        // console.log(second);
        context.fillText("Time: " + minute + " : " + second, 700, 40);
        offset = Date.now();

        drawMiniMap();

        context.restore();

        // update hp and life number
        if (tankP.lifeNum <= 0) {
            isWinning = false;
            loadGameOverScene();
        } else if (tankP.hp <= 0) {
            tankP.lifeNum--;
            tankP = new TankP("p0", tankP.lifeNum, 900, 900, 0, 0, 0, 0, speedMP, speedRP, hpMaxP, hpMaxP, mainWeaponTypeP, 0, mainWeaponsP[mainWeaponTypeP], 0, [], 0, tankPImg, tankOffset);
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
    curScene = "over";

    removeUI();

    isOver = true;

    context.save();
    context.translate(myCamera.x, myCamera.y);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(-(myWorld.maxX - canvas.width) / 2, -(myWorld.maxY - canvas.height) / 2);
    context.drawImage(mapImg, 0, 0);
    context.restore();

    let gameOverMenu = document.createElement("div");
    gameOverMenu.className = "menu UI";
    gameOverMenu.style.justifyContent = "flex-start";

    let gameOverText = document.createElement("p");
    gameOverText.id = "gameOverText";
    if (isWinning) {
        gameOverText.innerHTML = "YOU WIN!";
        score = Math.max(score + bonusScore, 0);
        if (score > hScore) hScore = score;
    } else {
        gameOverText.innerHTML = "GAME OVER~";
    }
    gameOverMenu.appendChild(gameOverText);

    let scoreText = document.createElement("p");
    scoreText.id = "scoreText";
    scoreText.innerHTML = "Your score: " + score;
    gameOverMenu.appendChild(scoreText);

    let tryAgainButton = document.createElement("button");
    tryAgainButton.id = "tryAgainButton";
    tryAgainButton.className = "rectButton";
    tryAgainButton.innerHTML = "TRY AGAIN";
    tryAgainButton.style.width = "200px";
    tryAgainButton.style.marginBottom = "50px";
    tryAgainButton.onclick = function() {
        clickAudio.play();
        clickAudio.currentTime = 0;
        loadGameScene();
    };
    gameOverMenu.appendChild(tryAgainButton);

    let quitButton = document.createElement("button");
    quitButton.id = "quitButton";
    quitButton.className = "rectButton";
    quitButton.innerHTML = "QUIT";
    quitButton.style.marginBottom = "50px";
    quitButton.onclick = function() {
        clickAudio.play();
        clickAudio.currentTime = 0;
        loadMenuScene();
    };
    gameOverMenu.appendChild(quitButton);

    div.appendChild(gameOverMenu);
}

window.onload = function() {
    let audioButton = document.createElement("button");
    audioButton.id = "audioButton";

    audioButton.onclick = function () {
        if (!bgmPlayed) {
            bgm.play();
            bgm.muted = false;
            audioButton.style.backgroundImage = "url('images/audio.png')";
            bgmPlayed = true;
        } else if (bgm.muted) {
            bgm.muted = false;
            audioButton.style.backgroundImage = "url('images/audio.png')";
        } else {
            bgm.muted = true;
            audioButton.style.backgroundImage = "url('images/mute.png')";
        }
    };
    div.appendChild(audioButton);
    loadMenuScene();
}