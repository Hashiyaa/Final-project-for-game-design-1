// @ts-check

// get the main div
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
let context = canvas.getContext("2d");

// game settings
let isOver = false;
let score = 0;
let hScore = 0;
let hp = 3000;

// initial params of spaceship
let posX = 450;
let posY = 450;
let orient = 0;
let forward = 0;
let clockwise = 0;
let speedM = 7;
let speedR = 3;

let fireTimer = 0;
let fireRate = 15;
let projSpeed = 7;

// projectiles
let projectiles = [];

// create new img element
let spaceshipImg = new Image(); 
spaceshipImg.src = 'images/spaceship.png'; // Set source path
let projectileImg = new Image();
projectileImg.src = 'images/projectile.png';

// set bounds
let leftBound = 0.5 * spaceshipImg.width;
let rightBound = canvas.width - 0.5 * spaceshipImg.width;
let upperBound = 0.5 * spaceshipImg.height;
let lowerBound = canvas.height - 0.5 * spaceshipImg.height;

// event listeners for keyboard
window.onkeydown = function (event) {
    event.preventDefault();
    var key = event.keyCode; //Key code of key pressed

    // a
    if (key === 65) {
        if (fireTimer >= fireRate) {
            fire();
            fireTimer = 0;
        }
    }

    // q
    if (key === 81) {
    }

    // w
    if (key === 87) {
    }

    // e
    if (key === 69) {
    }

    // r
    if (key === 82) {
    }

    // right arrow
    if (key === 39) {
        clockwise = 1;
    }
    // left arrow
    else if (key === 37) {
        clockwise = -1;
    }
    // top arrow 
    else if (key === 38) {
        forward = 1;
    }
    // down arrow
    else if (key === 40) {
        forward = -1;
    }
    // delete or backspace, for debug use
    else if (key === 8) {
        hp = 0;
    }
};

window.onkeyup = function (event) {
    // stop moving as soon as any key is up
    forward = 0;
    clockwise = 0;
};

// set up collectors
// const collectorTypes = ['household_food_waste', 'residual_waste', 'recyclable_waste', 'hazardous_waste'];
// let collectorIndex = 0;
// let collector = collectorTypes[0];

// let panY = 75; // offset of pan relative to spaceship

function drawSpaceship() {
    // update the orientation
    orient += clockwise * speedR;
    // update the position
    let dirX = Math.sin(orient / 180 * Math.PI);
    let dirY = -Math.cos(orient / 180 * Math.PI);
    if (((posX >= leftBound && dirX * forward <= 0) || (posX <= rightBound && dirX * forward >= 0)) && 
        ((posY >= upperBound && dirY * forward <= 0) || (posY <= lowerBound && dirY * forward >= 0))) {
        posX += dirX * forward * speedM;
        posY += dirY * forward * speedM;
    }
    // draw
    context.save();
    context.translate(posX, posY);
    context.rotate(orient / 180 * Math.PI);
    context.drawImage(spaceshipImg, -spaceshipImg.width * 0.5, -spaceshipImg.height * 0.5);
    context.restore();
}

function fire() {  
    let offsetX = Math.sin(orient / 180 * Math.PI) * spaceshipImg.height * 0.5;
    let offsetY = -Math.cos(orient / 180 * Math.PI) * spaceshipImg.height * 0.5;
    let proj = {x: posX + offsetX, y: posY + offsetY, a: orient, img: projectileImg};
    projectiles.push(proj);
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        context.save();
        if (proj.x >= 0 && proj.x <= canvas.width && proj.y >= 0 && proj.y <= canvas.height) {
            // update the position
            let dirX = Math.sin(proj.a / 180 * Math.PI);
            let dirY = -Math.cos(proj.a / 180 * Math.PI);
            proj.x += dirX * projSpeed;
            proj.y += dirY * projSpeed;
        } else {
            let i = projectiles.indexOf(proj);
            projectiles.splice(i, i + 1);
        }
        context.translate(proj.x , proj.y);
        context.rotate(proj.a / 180 * Math.PI);
        context.drawImage(proj.img, -proj.img.width * 0.5, -proj.img.height * 0.5);
        context.restore();
    });
}

// let garbages = [];
// let garbageTypes = [householdWaste, residualWaste, recyclableWaste, hazardousWaste];

// handle skull showing up
// let skull;
// let skullTimer = 0;
// let skullRate = 50;
// handle prompt message
let scoreMsg;
let scoreMsgTimer = 0;
let scoreMsgRate = 50;

function detectCollision() {
    // let panImg = new Image();
    // panImg.src = "images/dustpan.png";
    // for (let i = 0; i < garbages.length; i++) {
    //     // let gbgX = garbageList[i].getX() + garbageList[i].
    //     let g = garbages[i];
    //     // zone of detection
    //     let polygon = [[posX - panImg.width * 0.5, posY - panY - panImg.height * 0.5], 
    //         [posX + panImg.width * 0.5, posY - panY - panImg.height * 0.5], 
    //         [posX + panImg.width * 0.5, posY - panY + panImg.height * 0.5], 
    //         [posX - panImg.width * 0.5, posY - panY + panImg.height * 0.5]];
    //     if (inside(g.posX, g.posY, polygon)) {
    //         if (g.type === collector) {
    //             let hit = new Audio("sound/correct.wav");
    //             hit.load();
    //             hit.play();
    //             scoreMsg = "+100";
    //             hp = hp + 100; // 100 hp award for collecting the correct garbage
    //             score++;
    //         } else {
    //             let miss = new Audio("sound/hitting.wav");
    //             miss.load();
    //             miss.play();
    //             scoreMsg = "-50";
    //             if (hp > 50) {
    //                 hp -= 50; // 50 hp penalty for hitting the wrong garbage
    //             } else {
    //                 hp = 0;
    //             }
    //             skull = g; // make skull at the same position of that garbage
    //         }
    //          // remove garbage from the array
    //         garbages.splice(i, 1);
    //     }
    // }
}

function inside(x, y, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];

        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

function drawRefDot(posX, posY) {
    context.save();
    context.beginPath();
    context.arc(posX, posY, 10, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function removeUI() {
    // remove UI elements
    let UIs = document.getElementsByClassName('UI');
    while(UIs[0])
        UIs[0].parentNode.removeChild(UIs[0]);
}

let buttonW = 250;
let buttonH = 100;
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
    hp = 3000;
    isOver = false;
    score = 0;

    // reset the position of spaceship
    posX = 450;
    posY = 450;
    orient = 0;
    fireTimer = 0;

    projectiles = [];

    let energyBar = document.createElement("progress");
    energyBar.id = "energyBar";
    energyBar.className = "UI";
    energyBar.max = hp;
    energyBar.value = 0;
    div.appendChild(energyBar);

    let energyIcon = document.createElement("img");
    energyIcon.id = "energyIcon";
    energyIcon.className = "UI";
    energyIcon.src = "images/energy.png";
    div.appendChild(energyIcon);

    let garbageRate = 100;
    let clock = 0;
    let offset = Date.now();
    function draw() {
        if (isOver) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        ////////// spaceship section //////////
        drawSpaceship();
        fireTimer++;

        drawProjectiles();
        // console.log("x: " + posX + " y: " + posY);
        // check for collision between spaceship and garbage constantly
        detectCollision();
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
        context.fillStyle = "white";
        // let collectorWords = collector.split("_");
        // let collectorInfo = collectorWords.join(" ");
        context.font = "16px Georgia";
        // context.fillText("Collector type now: " + collectorInfo, 290, 580);
        context.fillText("Score: " + score, 80, 25);
        context.fillText("Highest score: " + hScore, 180, 25);
        context.fillText("Energy remaining: " + hp, 110, 70);

        if (scoreMsg) {
            if (scoreMsgTimer < scoreMsgRate) {
                context.fillText(scoreMsg, 300, 70);
                scoreMsgTimer++;
            } else {
                scoreMsg = null;
                scoreMsgTimer = 0;
            }
        }

        clock += (Date.now() - offset) / 1000;
        let second = Math.floor(clock % 60).toString();
        if ((Number(second) < 10)) second = '0' + second;
        let minute = Math.floor(clock / 60).toString();
        if ((Number(minute) < 10)) minute = '0' + minute;
        // console.log(second);
        context.fillText("Time: " + minute + " : " + second, 420, 43);
        offset = Date.now();
        context.restore();
        // update hp and energy bar
        if (hp > 0) {
            hp--;
        } else {
            loadGameOverScene();
        }
        energyBar.value = hp;

        context.restore();
        window.requestAnimationFrame(draw);
    }
    draw();
}

function loadGameOverScene() {
    removeUI();

    isOver = true;
    // skullTimer = skullRate;
    // garbages = [];

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

window.onload = function() {
    let audioButton = document.createElement("button");
    audioButton.id = "audioButton";
    audioButton.style.backgroundImage = "url('images/audio.png')";

    let audio = /** @type {HTMLAudioElement} */ (document.getElementById("music"));
    audio.play();
    audioButton.onclick = function() {
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