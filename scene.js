// @ts-check

// game settings
let garbageTimer = 100;
let isOver = false;
let score = 0;
let hScore = 0;
let hp = 3000;

// set up garbage types
let householdWaste = ['apple', 'bone', 'cheese', 'fish', 'watermelon'];
let residualWaste = ['cup'];
let recyclableWaste = ['can', 'soda'];
let hazardousWaste = ['battery', 'bulb'];

// initial params of spaceship
let posX = 300;
let posY = 450;
let dirX = 0;
let dirY = 0;
let speed = 10;

// event listeners for keyboard
window.onkeydown = function (event) {
    var key = event.keyCode; //Key code of key pressed

    // white space
    if (key === 32) {
        event.preventDefault();
        collectorIndex = ((collectorIndex + 1) % collectorTypes.length);
        collector = collectorTypes[collectorIndex];
    }

    // right arrow or d
    if (key === 39 || key === 68) {
        event.preventDefault();
        dirX = 1;
    }
    // left arrow or a
    else if (key === 37 || key === 65) {
        event.preventDefault();
        dirX = -1;
    }
    // top arrow or w
    else if (key === 38 || key === 87) {
        event.preventDefault();
        dirY = -1;
    }
    // down arrow of s
    else if (key === 40 || key === 83) {
        event.preventDefault();
        dirY = 1;
    }
    // delete or backspace, for debug use
    else if (key === 8) {
        event.preventDefault();
        hp = 0;
    }
};

window.onkeyup = function (event) {
    // stop moving as soon as any key is up
    dirX = 0;
    dirY = 0;
};

function removeUI() {
    // remove UI elements
    let UIs = document.getElementsByClassName('UI');
    while(UIs[0])
        UIs[0].parentNode.removeChild(UIs[0]);
}

// set up collectors
const collectorTypes = ['household_food_waste', 'residual_waste', 'recyclable_waste', 'hazardous_waste'];
let collectorIndex = 0;
let collector = collectorTypes[0];

let panY = 75; // offset of pan relative to spaceship

function drawSpaceship(context, posX, posY, spaceshipImg) {
    if (isOver) return;
    context.save();
    let panImg = new Image();
    panImg.src = "images/dustpan.png";
    let typeImg = new Image();
    typeImg.src = 'images/'.concat(collector, '.png');
    let typeY = panY + 12; // offset of pan relative to spaceship
    context.drawImage(panImg, posX - panImg.width * 0.5, posY - panY - panImg.height * 0.5);
    context.drawImage(spaceshipImg, posX - spaceshipImg.width * 0.5, posY - spaceshipImg.height * 0.5);
    context.drawImage(typeImg, posX - typeImg.width * 0.5, posY - typeY - typeImg.height * 0.5);
    // drawRefDot(context, posX, posY);
    context.restore();
}

let garbages = [];
let garbageTypes = [householdWaste, residualWaste, recyclableWaste, hazardousWaste];

// handle skull showing up
let skull;
let skullTimer = 0;
let skullRate = 50;
// handle prompt message
let scoreMsg;
let scoreMsgTimer = 0;
let scoreMsgRate = 50;

function detectCollision() {
    let panImg = new Image();
    panImg.src = "images/dustpan.png";
    for (let i = 0; i < garbages.length; i++) {
        // let gbgX = garbageList[i].getX() + garbageList[i].
        let g = garbages[i];
        // zone of detection
        let polygon = [[posX - panImg.width * 0.5, posY - panY - panImg.height * 0.5], 
            [posX + panImg.width * 0.5, posY - panY - panImg.height * 0.5], 
            [posX + panImg.width * 0.5, posY - panY + panImg.height * 0.5], 
            [posX - panImg.width * 0.5, posY - panY + panImg.height * 0.5]];
        if (inside(g.posX, g.posY, polygon)) {
            if (g.type === collector) {
                let hit = new Audio("sound/correct.wav");
                hit.load();
                hit.play();
                scoreMsg = "+100";
                hp = hp + 100; // 100 hp award for collecting the correct garbage
                score++;
            } else {
                let miss = new Audio("sound/hitting.wav");
                miss.load();
                miss.play();
                scoreMsg = "-50";
                if (hp > 50) {
                    hp -= 50; // 50 hp penalty for hitting the wrong garbage
                } else {
                    hp = 0;
                }
                skull = g; // make skull at the same position of that garbage
            }
             // remove garbage from the array
            garbages.splice(i, 1);
        }
    }
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

function genGarbage() {
    if (isOver) return;
    // randomly generate a type of garbage
    let typeIndex = Math.floor(Math.random() * garbageTypes.length);
    let type = collectorTypes[typeIndex];
    let nameIndex = Math.floor(Math.random() * garbageTypes[typeIndex].length);
    let name = (garbageTypes[typeIndex])[nameIndex];
    // range from 75, 525
    let randomX = Math.floor(Math.random() * 450 + 75);
    // range from 0.5 to 2
    let randomVelocity = Math.random() * 1.5 + 0.5;
    // get the width and height of source image
    let gImg = new Image();
    gImg.src = "images/" + name + ".png";
    // create a new garbage
    let g = {posX: randomX, posY: 0, type: type, name: name, v: randomVelocity};
    //let gbg = new garbage(randomX, 0, type, name, randomVelocity); // hard code
    garbages.push(g);
}

function drawGarbage(context) {
    context.save();
    for (let i = 0; i < garbages.length; i++) {
        let g = garbages[i];
        let name = g.name;
        let gImg = new Image();
        gImg.src = "images/" + name + ".png";
        context.drawImage(gImg, g.posX - gImg.width * 0.5, g.posY - gImg.height * 0.5);
        // drawRefDot(context, g.posX, g.posY);
    }
    context.restore();
}

function drawRefDot(context, posX, posY) {
    context.save();
    context.beginPath();
    context.arc(posX, posY, 10, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

// get the main div
let div = document.getElementById("main");
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));

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
    posX = 300;
    posY = 450;

    // set up the canvas
    let context = canvas.getContext("2d");

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

    // create new img element
    let spaceshipImg = new Image(); 
    spaceshipImg.src = 'images/spaceship.png'; // Set source path

    let garbageRate = 100;
    let clock = 0;
    let offset = Date.now();
    function draw() {
        if (isOver) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        ////////// spaceship section //////////
        drawSpaceship(context, posX, posY, spaceshipImg);
        // set bounds
        let leftBound = 20;
        let rightBound = canvas.width - 20;
        let upperBound = 200;
        let lowerBound = canvas.height - 50;
        // update the position
        if ((posX >= leftBound && dirX < 0) || (posX <= rightBound && dirX > 0)) {
            posX += dirX * speed;
        }
        if ((posY >= upperBound && dirY < 0) || (posY <= lowerBound && dirY > 0)) {
            posY += dirY * speed;
        }
        // console.log("x: " + posX + " y: " + posY);
        // check for collision between spaceship and garbage constantly
        detectCollision();
        // draw the skull if hit
        if (skull) {
            if (skullTimer < skullRate) {
                let skullImg = new Image();
                skullImg.src = "images/skull.png";
                context.drawImage(skullImg, skull.posX - 0.5 * skullImg.width,
                    skull.posY - 0.5 * skullImg.height);
                skullTimer++;
            } else {
                skull = null;
                skullTimer = 0;
            }
        }


        ////////// garbage section //////////
        garbageTimer++;
        if (garbageTimer >= garbageRate) {
            genGarbage();
            garbageTimer = 0;
        }
        // update the position of garbages
        for (let i = 0; i < garbages.length; i++) {
            let g = garbages[i];
            if (g.posY > canvas.height) {
                garbages.splice(i, 1);
            } else {
                g.posY += g.v;
            }
        }
        drawGarbage(context);

        ////////// UI section //////////
        // update highest score
        if (score > hScore) hScore = score;
        // draw texts
        context.save();
        context.fillStyle = "white";
        let collectorWords = collector.split("_");
        let collectorInfo = collectorWords.join(" ");
        context.font = "16px Georgia";
        context.fillText("Collector type now: " + collectorInfo, 290, 580);
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
        console.log(second);
        context.fillText("Time: " + minute + " : " + second, 420, 43);
        offset = Date.now();
        context.restore();
        // update hp and energy bar
        if (hp > 0) {
            hp--;
        } else {
            loadGameoverScene();
        }
        energyBar.value = hp;

        context.restore();
        window.requestAnimationFrame(draw);
    }
    draw();
}

function loadGameoverScene() {
    removeUI();

    isOver = true;
    skullTimer = skullRate;
    garbages = [];

    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    let gameoverMenu = document.createElement("div");
    gameoverMenu.className = "menu UI";

    let gameoverText = document.createElement("p");
    gameoverText.id = "gameOverText";
    gameoverText.innerHTML = "GAME OVER";
    gameoverMenu.appendChild(gameoverText);

    let scoreText = document.createElement("p");
    scoreText.id = "scoreText";
    scoreText.innerHTML = "Score: " + score;
    gameoverMenu.appendChild(scoreText);

    let tryAgainButton = document.createElement("button");
    tryAgainButton.id = "tryAgainButton";
    tryAgainButton.className = "rectButton";
    tryAgainButton.innerHTML = "TRY AGAIN";
    tryAgainButton.style.marginBottom = "50px";
    tryAgainButton.onclick = loadGameScene;
    gameoverMenu.appendChild(tryAgainButton);

    let quitButton = document.createElement("button");
    quitButton.id = "quitButton";
    quitButton.className = "rectButton";
    quitButton.innerHTML = "QUIT";
    quitButton.style.marginBottom = "50px";
    quitButton.onclick = loadMenuScene;
    gameoverMenu.appendChild(quitButton);

    div.appendChild(gameoverMenu);
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