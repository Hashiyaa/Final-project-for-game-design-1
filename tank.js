import {
    myWorld,
    obstacles,
    mainWeaponsP,
    secondaryWeaponsP,
    mainWeaponsE
} from "./scene.js";

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

// @ts-check
class Tank {

    constructor(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, weaponType, curWeapon, fireTimer, projectiles, img, offset) {
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
        this.weaponType = weaponType;
        this.curWeapon = curWeapon;
        this.fireTimer = fireTimer;
        this.projectiles = projectiles;
        this.img = img;
        this.offset = offset;
    }

    move() {
        // 0 and 1 -> 1, 2 and 3 -> -1
        if (this.obstacle != -1 && (1 - 2 * Math.floor(this.obstacle / 2)) * this.forward > 0) {
            // console.log("Stuck!");
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
        }
    }

    fire() {
        let offsetX = Math.sin(this.orient / 180 * Math.PI) * (this.img.height * 0.5 + this.offset);
        let offsetY = -Math.cos(this.orient / 180 * Math.PI) * (this.img.height * 0.5 + this.offset);
        let proj = {
            x: this.posX + offsetX,
            y: this.posY + offsetY + this.offset,
            a: this.orient,
            speed: this.curWeapon.projSpeed,
            img: this.curWeapon.projImg
        };
        this.projectiles.push(proj);
    }

    switchWeapon() {
        let mainWeapons = this.id.charAt[0] = 'p' ? mainWeaponsP : mainWeaponsE;
        let secondaryWeapons = this.id.charAt[0] = 'p' ? secondaryWeaponsP : secondaryWeaponsE;
        if (this.weaponType == 'm') {
            this.curWeapon = mainWeapons[this.mWeapon];
        } else {
            this.curWeapon = secondaryWeapons[this.sWeapon];
        }
    }

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
                    }
                }
            }
            for (let j = 0; j < obstacles.length; j++) {
                let obs = obstacles[j];
                // drawRefPolygon(obs);
                if (inside(proj.x, proj.y, obs)) {
                    //console.log("Hit Obs!");
                    this.projectiles.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

export class TankP extends Tank {
    constructor(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, weaponType, curWeapon, fireTimer, projectiles, img, offset) {
        super(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, weaponType, curWeapon, fireTimer, projectiles, img, offset);
    }

}

export class TankE extends Tank {
    constructor(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, curR, hp, hpMax, view, mWeapon, sWeapon, weaponType, curWeapon, fireTimer, projectiles, img, offset) {
        super(id, posX, posY, orient, obstacle, forward, clockwise, speedM, speedR, hp, hpMax, mWeapon, sWeapon, weaponType, curWeapon, fireTimer, projectiles, img, offset);
        this.curR = curR;
        this.view = view;
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
            console.log("Id: " + this.id + ", curR: ", this.curR);
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

        let obstacle;
        let obstacleSide;
        search: for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            for (let j = 0; j < obs.length; j++) {
                let vecSide = [obs[j][0] - this.posX, obs[j][1] - this.posY];
                let curSide = vecSide[0] * vec2[1] - vecSide[1] * vec2[0];
                if (j == 0) {
                    obstacleSide = curSide;
                } else {
                    if (obstacleSide * curSide < 0) {
                        obstacle = 1;
                        break search;
                    } else {
                        obstacle = 0;
                    }
                }
            }
        }

        // console.log("Id: " + this.id + ", Obs: " + obstacle);
        // console.log("Orientation: " + tank.orient + ", Angle: " + angle);
        if (Math.abs(angle) < 1 && !obstacle) {
            // console.log("Fire!");
            this.forward = 0;
            this.clockwise = 0;
            if (this.fireTimer >= this.curWeapon.fireRate) {
                this.fire();
                this.fireTimer = 0;
            }
        } else if (Math.abs(angle) < this.view * 0.5 && !obstacle) {
            // console.log("Detected!");
            this.forward = 0;
            this.clockwise = dir;
        } else {
            // this.clockwise = 0;
            this.forward = 1;
        }
    }
}