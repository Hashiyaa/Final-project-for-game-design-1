import {
    myWorld,
    obstacles
} from "./scene.js";

let fireAudioP = new Audio("sound/fireP.wav");
let fireAudioE = new Audio("sound/fireE.wav");
// let mgAudio = new Audio("sound/machinegun.wav");
// let hitAudio = new Audio("sound/hit.wav");
let hitWallAudio = new Audio("sound/hitWall.wav");
// let explodeAudio = new Audio("sound/explode.wav");

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

function intersect(point1, point2, vs) {
    let number = 0;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let vec1 = [vs[j][0] - vs[i][0], vs[j][1] - vs[i][1]];
        let vec2 = [vs[i][0] - point1[0], vs[i][1] - point1[1]];
        let vec3 = [vs[i][0] - point2[0], vs[i][1] - point2[1]];
        let intersect1 = (vec2[0] * vec1[1] - vec2[1] * vec1[0]) /
            (vec3[0] * vec1[1] - vec3[1] * vec1[0]);
        intersect1 = intersect1 / Math.abs(intersect1);
        let vec4 = [point2[0] - point1[0], point2[1] - point1[1]];
        let vec5 = [point1[0] - vs[i][0], point1[1] - vs[i][1]];
        let vec6 = [point1[0] - vs[j][0], point1[1] - vs[j][1]];
        let intersect2 = (vec5[0] * vec4[1] - vec5[1] * vec4[0]) /
            (vec6[0] * vec4[1] - vec6[1] * vec4[0]);
        intersect2 = intersect2 / Math.abs(intersect2);
        // console.log("Intersect: " + intersect1 + " and " + intersect2);
        if (intersect1 == -1 && intersect2 == -1) {
            number++;
        }
    }
    // console.log("Number: " + number);
    return number > 1;
}

// @ts-check
class Tank {

    constructor(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, curWeapon, fireTimer, projectiles, attacked, img, offset) {
        this.id = id;
        this.posX = posX;
        this.posY = posY;
        this.orient = orient;
        this.obstacle = obstacle;
        this.forward = forward;
        this.clockwise = clockwise;
        this.speedM = speedM;
        this.speedR = speedR;
        this.hp = hp;
        this.hpMax = hpMax;
        this.mWeapon = mWeapon;
        this.sWeapon = sWeapon;
        // this.weaponType = weaponType;
        this.curWeapon = curWeapon;
        this.fireTimer = fireTimer;
        this.projectiles = projectiles;
        this.attacked = attacked;
        this.img = img;
        this.offset = offset;
    }

    move() {
        // 0 and 1 -> 1, 2 and 3 -> -1
        if (this.obstacle != -1 && (1 - 2 * Math.floor(this.obstacle / 2)) * this.forward > 0) {
            // console.log("Stuck!");
            hitWallAudio.play();
            return;
        }
        // update the orientation
        this.orient += this.clockwise * this.speedR;
        // update the position
        let dirX = Math.sin(this.orient / 180 * Math.PI);
        let dirY = -Math.cos(this.orient / 180 * Math.PI);

        // maybe hard code
        let disX = myWorld.maxX / 2 - this.posX;
        let disY = myWorld.maxY / 2 - this.posY - this.offset;
        let dis = Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
        // if (((tank.posX >= leftBound && dirX * tank.forward <= 0) || (tank.posX <= rightBound && dirX * tank.forward >= 0)) &&
        //    ((tank.posY >= upperBound && dirY * tank.forward <= 0) || (tank.posY <= lowerBound && dirY * tank.forward >= 0))) {

        if (dis < myWorld.mapRadius - this.img.width / 2 || (dirX * disX + dirY * disY) * this.forward > 0) {
            this.posX += dirX * this.forward * this.speedM;
            this.posY += dirY * this.forward * this.speedM;
            this.obstacle = -1;
        } else if (this.forward != 0) {
            hitWallAudio.play();
            // hitWallAudio.currentTime = 0;
        }
    }

    fire() {
        if (this.id.charAt(0) == 'p') {
            // if (this.weaponType == 'm') {
            fireAudioP.play();
            fireAudioP.currentTime = 0;
            // } else {
            //     mgAudio.play();
            //     mgAudio.currentTime = 0;
            // }
        } else {
            fireAudioE.play();
            fireAudioE.currentTime = 0;
        }
        let offsetX = Math.sin(this.orient / 180 * Math.PI) * (this.img.height * 0.5 + this.offset);
        let offsetY = -Math.cos(this.orient / 180 * Math.PI) * (this.img.height * 0.5 + this.offset);
        let variance = Math.random() * 10 - 5; // a random number between -5 to 5
        let angle = this.id.charAt(0) == 'p' ? this.orient : this.orient + variance;
        let proj = {
            x: this.posX + offsetX,
            y: this.posY + offsetY + this.offset,
            a: angle,
            speed: this.curWeapon.projSpeed,
            img: this.curWeapon.projImg
        };
        this.projectiles.push(proj);
    }

    // switchWeapon() {
    //     let mainWeapons = this.id.charAt[0] = 'p' ? mainWeaponsP : mainWeaponsE;
    //     let secondaryWeapons = this.id.charAt[0] = 'p' ? secondaryWeaponsP : secondaryWeaponsE;
    //     if (this.weaponType == 'm') {
    //         this.curWeapon = mainWeapons[this.mWeapon];
    //     } else {
    //         this.curWeapon = secondaryWeapons[this.sWeapon];
    //     }
    // }

    getPolygon(mode) {
        let center = [this.posX, this.posY + this.offset];
        let diagonalHalf = Math.sqrt(Math.pow(this.img.width * 0.5, 2) + Math.pow(this.img.height * 0.5 - this.offset, 2));
        // collision mode
        if (mode == 'c') {
            // center = [tank.posX, tank.posY];
            diagonalHalf = Math.sqrt(Math.pow(this.img.width * 0.5, 2) + Math.pow(this.img.height * 0.5, 2));
        }
        let a1 = Math.acos(this.img.width * 0.5 / diagonalHalf) / Math.PI * 180;
        let pointtl = [-diagonalHalf * Math.cos((a1 + this.orient) * Math.PI / 180),
            -diagonalHalf * Math.sin((a1 + this.orient) * Math.PI / 180)
        ];
        let pointtr = [diagonalHalf * Math.cos((a1 - this.orient) * Math.PI / 180),
            -diagonalHalf * Math.sin((a1 - this.orient) * Math.PI / 180)
        ];
        let pointbr = [-pointtl[0], -pointtl[1]];
        let pointbl = [-pointtr[0], -pointtr[1]];
        let polygon = [pointtl, pointtr, pointbr, pointbl];
        for (let k = 0; k < polygon.length; k++) {
            let point = polygon[k];
            point[0] += center[0];
            point[1] += center[1];
            if (mode == 'c') {
                point[0] += this.offset * Math.sin(this.orient * Math.PI / 180);
                point[1] += -this.offset * Math.cos(this.orient * Math.PI / 180);
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

    detectCollision(enemies) {
        let polygon = this.getPolygon('c');
        for (let i = 0; i < enemies.length; i++) {
            let tank = enemies[i];
            // zone of detection
            // console.log(polygon);
            let polygonB = tank.getPolygon('c');
            for (let j = 0; j < polygon.length; j++) {
                let point = polygon[j];
                if (inside(point[0], point[1], polygonB)) {
                    //console.log("Collide!");
                    this.obstacle = j;
                    return;
                }
                // this.obstacle = -1;
            }
        }
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            // drawRefPolygon(obs);
            for (let j = 0; j < polygon.length; j++) {
                let point = polygon[j];
                if (inside(point[0], point[1], obs)) {
                    //console.log("Collide!");
                    this.obstacle = j;
                    return;
                }
                // this.obstacle = -1;
            }
        }
    }

    detectHit(enemies) {
        for (let i = 0; i < this.projectiles.length; i++) {
            let proj = this.projectiles[i];
            // zone of detection
            for (let j = 0; j < enemies.length; j++) {
                let tankE = enemies[j];
                let polygon = tankE.getPolygon('h');
                // console.log(polygon);
                if (inside(proj.x, proj.y, polygon)) {
                    // console.log("Hit!");
                    this.projectiles.splice(i, 1);
                    i--;

                    if (tankE.hp > 0) {
                        tankE.hp -= this.curWeapon.damage;
                        tankE.attacked = 1;
                    }
                    break;
                }
            }
            for (let j = 0; j < obstacles.length; j++) {
                let obs = obstacles[j];
                // drawRefPolygon(obs);
                if (inside(proj.x, proj.y, obs)) {
                    //console.log("Hit Obs!");
                    this.projectiles.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }
}

export class TankP extends Tank {
    constructor(id, lifeNum, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, curWeapon, fireTimer, projectiles, attacked, img, offset) {
        super(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, curWeapon, fireTimer, projectiles, attacked, img, offset);
        this.lifeNum = lifeNum;
    }

}

export class TankE extends Tank {
    constructor(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, curR, hp, hpMax, visionCone, mWeapon, sWeapon, curWeapon, fireTimer, projectiles, attacked, img, offset) {
        super(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, curWeapon, fireTimer, projectiles, attacked, img, offset);
        this.curR = curR;
        this.visionCone = visionCone;
    }

    move() {
        if (this.obstacle != -1 && (1 - 2 * Math.floor(this.obstacle / 2)) * this.forward > 0) {
            this.forward = 0;
            this.clockwise = 1 - 2 * this.obstacle;
            if (this.curR < 0) this.curR = 0;
        }

        // update the orientation
        this.orient += this.clockwise * this.speedR;
        if (this.curR >= 0) {
            if (this.curR <= 90) {
                this.curR += Math.abs(this.clockwise * this.speedR);
            } else {
                this.obstacle = -1;
                this.curR = -1;
                this.forward = 1;
                this.clockwise = 0;
            }
            // console.log("Id: " + this.id + ", curR: ", this.curR);
            return;
        }

        // update the position
        let dirX = Math.sin(this.orient / 180 * Math.PI);
        let dirY = -Math.cos(this.orient / 180 * Math.PI);

        // maybe hard code
        let disX = myWorld.maxX / 2 - this.posX;
        let disY = myWorld.maxY / 2 - this.posY - this.offset;
        let dis = Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
        // if (((tank.posX >= leftBound && dirX * tank.forward <= 0) || (tank.posX <= rightBound && dirX * tank.forward >= 0)) &&
        //    ((tank.posY >= upperBound && dirY * tank.forward <= 0) || (tank.posY <= lowerBound && dirY * tank.forward >= 0))) {

        if (dis < myWorld.mapRadius - this.img.width / 2 || (dirX * disX + dirY * disY) * this.forward > 0) {
            this.posX += dirX * this.forward * this.speedM;
            this.posY += dirY * this.forward * this.speedM;
            this.obstacle = -1;
        } else {
            let polygon = this.getPolygon();
            let maxDis = 0;
            for (let i = 0; i < polygon.length; i++) {
                let pointDis = Math.sqrt(Math.pow(myWorld.maxX / 2 - polygon[i][0], 2) + Math.pow(myWorld.maxY / 2 - polygon[i][1], 2));
                if (pointDis > maxDis) {
                    maxDis = pointDis;
                    this.obstacle = i;
                }
            }
            // console.log("Id: " + this.id + ", Obs: " + this.obstacle);
        }
    }

    searchForPlayer(tankP) {
        let vec1 = [Math.sin(this.orient / 180 * Math.PI), -Math.cos(this.orient / 180 * Math.PI)];
        let vec2 = [tankP.posX - this.posX, tankP.posY - this.posY];
        let vec1Mag = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
        let vec2Mag = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
        let angle = Math.acos((vec1[0] * vec2[0] + vec1[1] * vec2[1]) / (vec1Mag * vec2Mag)) / Math.PI * 180;
        let dir = vec1[0] * vec2[1] - vec1[1] * vec2[0];
        dir /= Math.abs(dir); // positive -> right, negative -> left


        let obstacle = 0;
        // let obstacleSide;
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            if (intersect([tankP.posX, tankP.posY - tankP.offset], [this.posX, this.posY - this.offset], obs)) {
                obstacle = 1;
                break;
            }
        }

        // console.log("Id: " + this.id + ", Obs: " + obstacle);
        // console.log("Orientation: " + tank.orient + ", Angle: " + angle);
        if (Math.abs(angle) < 3 && !obstacle) {
            // console.log("Fire!");
            this.attacked = 0;
            this.forward = 0;
            this.clockwise = 0;
            if (this.fireTimer >= this.curWeapon.fireRate) {
                this.fire();
                this.fireTimer = 0;
            }
        } else if (Math.abs(angle) < this.visionCone * 0.5 && !obstacle) {
            // console.log("Detected!");
            this.attacked = 0;
            this.forward = 0;
            this.clockwise = dir;
        } else if (this.attacked && !obstacle) {
            // console.log("Attacked!");
            this.forward = 0;
            this.clockwise = dir;
        } else if (this.curR >= 0) {
            // this.clockwise = 0;
            this.forward = 1;
        } else {
            this.clockwise = 0;
            this.forward = 1;
        }
    }
}