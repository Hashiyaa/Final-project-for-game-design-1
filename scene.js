// @ts-check
import {
    TankE,
    TankP
} from "./tank.js";

// get the main div and canvas ready
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
let context = canvas.getContext("2d");

// create assets
let bgm;

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

let tankEImg = new Image();
tankEImg.src = 'images/tank_enemy.png';
let shellImgE = new Image();
shellImgE.src = 'images/shell_enemy.png';

// game settings
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

// stats for weapons
let mainWeaponsP = [];
let shellP = {
    type: 'm',
    damage: 20,
    fireRate: 100, // the smaller, the faster
    projSpeed: 7,
    projImg: shellImgP
};
mainWeaponsP.push(shellP);
// armor-piercing shells
let apShell = {
    type: 'm',
    damage: 50,
    fireRate: 160,
    projSpeed: 7,
    projImg: apShellImgP
};
mainWeaponsP.push(apShell);
// High-explosive bombs
let heShell = {
    type: 'm',
    damage: 40,
    fireRate: 200,
    projSpeed: 7,
    projImg: heShellImgP
};
mainWeaponsP.push(heShell);

let secondaryWeaponsP = [];
// machine gun
let machineGunP = {
    type: 's',
    damage: 1,
    fireRate: 10,
    projSpeed: 10,
    projImg: mgBulletImgP
};
secondaryWeaponsP.push(machineGunP);

let mainWeaponsE = [];
let shellE = {
    type: 'm',
    damage: 20,
    fireRate: 100,
    projSpeed: 7,
    projImg: shellImgE
};
mainWeaponsE.push(shellE);

// armor-piercing shells
let apShellE = {
    type: 'm',
    damage: 50,
    fireRate: 160,
    projSpeed: 7,
    projImg: apShellImgP
};
mainWeaponsE.push(apShellE);

export {
    myWorld,
    obstacles,
    mainWeaponsP,
    secondaryWeaponsP,
    mainWeaponsE
};

let myCamera;
let isOver = false;
let isWinning = false;
// UI settings
let score = 0;
let bonusScore = 0;
let hScore = 0;
let hpBarWidth = 60;
let hpBarHeight = 10;
let buttonW = 250;
let buttonH = 100;

// tank gloal vars
let hpMaxP = 400;
let tankOffset = 15;

// initial params of player's tank
let tankP;

// enemy parameters
let enemies = [];
let spawnOffset = 400;
let enemySpawns = [{
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

let enemyNum = 1;
let hpMaxE = 50;
let enemySpeedM = 2;
let enemySpeedR = 1;
let enemyView = 45;
let enemyMainWeaponType = 0;


function clamp(value, min, max) {
    if (value < min) return min;
    else if (value > max) return max;
    return value;
}

// event listeners for keyboard
window.onkeydown = function (event) {
    event.preventDefault();
    var key = event.keyCode; //Key code of key pressed

    // space
    if (key === 32) {
        if (tankP.fireTimer >= tankP.curWeapon.fireRate) {
            tankP.fire();
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
        if (proj.x >= myWorld.minX && proj.x <= myWorld.maxX && proj.y >= myWorld.minY && proj.y <= myWorld.maxY) {
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
    removeUI();

    context.clearRect(0, 0, canvas.width, canvas.height);

    bgm.volume = 1;

    let startMenu = document.createElement("div");
    startMenu.className = "menu UI";

    let title = document.createElement("p");
    title.className = "header";
    title.innerHTML = "Tank Expert";
    title.style.fontSize = "60px";
    startMenu.appendChild(title);

    // Create Buttons
    let startButton = document.createElement("button");
    startButton.id = "startButton";
    startButton.className = "rectButton";
    startButton.style.left = (0.5 * (canvas.width - buttonW)).toString() + "px";
    startButton.style.top = (0.5 * (canvas.height - buttonH)).toString() + "px";
    startButton.innerHTML = "START";
    startButton.onclick = loadTagScene;
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

function loadTagScene() {
    removeUI();

    let tagMenu = document.createElement("div");
    tagMenu.className = "menu UI";
    // tagMenu.style.flexDirection = "row";

    let header = document.createElement("p");
    header.id = "tagHeader";
    header.className = "header";
    header.innerHTML = "Configure your enemies and win bonus points!";
    // header.style.lineHeight = "20px";
    tagMenu.appendChild(header);

    let tagList = document.createElement("div");
    tagList.id = "tagList";
    tagList.className = "menu";
    tagList.style.position = "relative";
    tagList.style.height = "350px";
    tagList.style.flexDirection = "row";
    tagMenu.appendChild(tagList);

    let enemyTagList = document.createElement("div");
    enemyTagList.id = "tagLeftList";
    enemyTagList.className = "menu";
    enemyTagList.style.width = "600px";
    enemyTagList.style.height = "350px";
    enemyTagList.style.alignItems = "flex-start";
    enemyTagList.style.paddingLeft = "40px";
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

    let enemyTags = [{name: "hp", cond: "Enemies' health points * 2"}, 
        {name: "speedM", cond: "Enemies' Movement Speed * 2"}, 
        {name: "speedR", cond: "Enemies' Rotation Speed * 2"}, 
        {name: "view", cond: "Enemies' range of view * 2"}, 
        {name: "shell", cond: "Enemies use armor-piercing shells"}];
    let checkboxes = [];
    let scoreLabels = [];
    for (let i = 0; i < enemyTags.length; i++) {
        let name = enemyTags[i].name + "Toggle";
        let enemyTag = document.createElement("div");
        enemyTag.style.paddingLeft = "50px";
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = name;
        checkbox.className = "tagToggle";
        enemyTag.appendChild(checkbox);
        checkboxes.push(checkbox);
        let label = document.createElement("label");
        label.className = "tagLabel";
        label.htmlFor = name;
        label.innerHTML = enemyTags[i].cond;
        enemyTag.appendChild(label);
        let scoreLabel = document.createElement("label");
        scoreLabel.className = "tagLabel";
        scoreLabel.htmlFor = name;
        scoreLabel.innerHTML = "+ 50 points * " + enemyNumSelect.value;
        scoreLabel.style.display = "none";
        scoreLabels.push(scoreLabel);
        enemyTag.appendChild(scoreLabel);
        checkbox.onchange = function() {
            if (checkbox.checked) {
                scoreLabel.style.display = "inline";
            } else {
                scoreLabel.style.display = "none";
            }
        };
        enemyTagList.appendChild(enemyTag);
    }

    enemyNumSelect.onchange = function() {
        for (let i = 0; i < scoreLabels.length; i++) {
            scoreLabels[i].innerHTML = "+ 50 points * " + enemyNumSelect.value;
        }
    };

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
    backButton.style.width = "150px";
    backButton.style.height = "60px";
    backButton.onclick = loadMenuScene;
    buttonPanel.appendChild(backButton);

    let goButton = document.createElement("button");
    goButton.id = "goButton";
    goButton.className = "rectButton";
    goButton.innerHTML = "GO!";
    goButton.onclick = function() {
        enemyNum = Number(enemyNumSelect.value);
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                if (i == 0) {
                    hpMaxE *= 2;
                } else if (i == 1) {
                    enemySpeedM *= 2;
                } else if (i == 2) {
                    enemySpeedR *= 2;
                } else if (i == 3) {
                    enemyView *= 2;
                } else if (i == 4) {
                    enemyMainWeaponType = 1;
                }
                bonusScore += 50 * enemyNum;
            }
        }
        loadGameScene();
    };
    buttonPanel.appendChild(goButton);

    div.appendChild(tagMenu);
}

function loadGameScene() {
    // remove UI elements
    removeUI();

    // reset some global variables
    isOver = false;
    score = 0;

    enemies = [];

    // reset the position of player's tank
    tankP = new TankP("p0", 900, 900, 0, 0, 0, 0, 4, 2, hpMaxP, hpMaxP, 0, 0, 'm', shellP, 0, [], 0, tankPImg, tankOffset);

    for (let i = 0; i < enemyNum; i++) {
        let randPos = Math.floor(Math.random() * enemySpawns.length);
        let randO = (i % enemyNum) * 90 + 45 + 45 * Math.random();
        let enemy = new TankE("e" + i, enemySpawns[randPos].x, enemySpawns[randPos].y, randO, 0, 0, 0, enemySpeedM, enemySpeedR, -1, hpMaxE, hpMaxE, enemyView, enemyMainWeaponType, 0, 'm', mainWeaponsE[enemyMainWeaponType], 0, [], 0, tankEImg, tankOffset);
        enemies.push(enemy);
        enemySpawns.splice(randPos, 1);
    }

    let clock = 0;
    let offset = Date.now();

    function draw() {
        if (isOver) return;

        bgm.volume = 0.5;

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
                score += 50;
            }
        });

        drawTank(tankP);
        tankP.switchWeapon();
        tankP.detectCollision(enemies);
        tankP.detectHit(enemies);
        tankP.move();
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
        // draw texts
        context.save();
        context.fillStyle = "white";
        context.font = "16px Georgia";
        context.translate(myCamera.x, myCamera.y);
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

    context.save();
    context.translate(myCamera.x, myCamera.y);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(-(myWorld.maxX - canvas.width) / 2, -(myWorld.maxY - canvas.height) / 2);
    context.drawImage(mapImg, 0, 0);
    context.restore();

    let gameOverMenu = document.createElement("div");
    gameOverMenu.className = "menu UI";

    let gameOverText = document.createElement("p");
    gameOverText.id = "gameOverText";
    if (isWinning) {
        gameOverText.innerHTML = "YOU WIN!";
        score += bonusScore;
        if (score > hScore) hScore = score;
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
    bgm = audio;
    audio.play();
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