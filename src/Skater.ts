
import { AnimationManager } from "./AnimationManager";
import { Collision, CollisionBox } from "./collision";
import { gameObjects, getTranslatedPos, WIDTH } from "./main";
import { Obsticle } from "./Obsticle";
import { Platform } from "./Platform";
import { GameObject, Point } from "./types";


interface SkaterState {
    update(skater: Skater): void;
}

class JumpingState implements SkaterState {
  
    private jumpFrame: number;
    private vel: Point;

    constructor(vel: Point){
        this.jumpFrame = 0;
        this.vel = vel;
    }

    update(skater: Skater): void {

        if (this.jumpFrame > 0 && skater.isBlockedDown) {
            skater.state = new CruisingState(this.vel.x -= 1);
            skater.vel.y = 0;
            return;
        } 

        this.jumpFrame++;

        // Determine velocity y

        const g = 2;
        const vi = this.vel.y;

        skater.vel.x = this.vel.x;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls the skater 1 pixel downwards. t is the number of frames. 
        skater.vel.y = vi + (g * this.jumpFrame);
    }

}

class CruisingState implements SkaterState {
    private velX: number;

    constructor(velX: number) {
        this.velX = velX;
    }

    update(skater: Skater): void {
        skater.vel.x = this.velX;

            if(skater.isBlockedDown) {
                skater.vel.y = 0;
            } else {
                skater.vel.y = 4;
            }
    }

}

export class Skater implements GameObject {

    pos: Point;
    width: number;
    height: number;
    vel: Point;
    private animations: AnimationManager;

    public id: string;
    public type: string;

    state: SkaterState;
    isBlockedDown: boolean;
   
    constructor(pos: Point, vel: Point) {

        this.pos = pos;
        this.vel = vel;
        this.type = "skater";
        this.id = "skater";

        this.width = 20;
        this.height = 32;
        this.state = new CruisingState(2);
        this.isBlockedDown = false;

        // Setup sprite animations
        
        this.animations = new AnimationManager(this);
        this.animations.create("skater-cruise", {loop: true, frames: ["skater-cruise"]});
        this.animations.play("skater-cruise");

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, width: this.width, height: this.height }
    }

    private isJumping(){
        return this.state instanceof JumpingState;
    }

    y(obj: GameObject) {
        return this.pos.y;
    }

    update(_: number, collisions: Collision[]): void {

        this.isBlockedDown = false;

        let standingOnObsticle = false;

        let isConsideringObsticle = true;
        
        // Check if obsticle is close and then initate a jump
      
        // Sorted by placing obsticles last beacuse we want to have that as the last standing point.
        const collisionsSorted = collisions.sort((c1, c2) => {
            if(c1.obj instanceof Obsticle) return 1; 
            if(c2.obj instanceof Obsticle) return -1;
            return 0;
        
        });

        for (const c of collisionsSorted) {
            if( isConsideringObsticle || !(c.obj instanceof Obsticle)) {
                this.isBlockedDown = true;
                standingOnObsticle = c.obj instanceof Obsticle;
                const y = c.obj.y(this);
                this.pos.y =  y - this.height;
            }
        }

        // Check if close to obsticle and should jump onto it

        if(!standingOnObsticle && !this.isJumping()) {

            const closeToObsticle = this.isCloseToObsticle(gameObjects);
            const closeToStairs = this.isCloseToStairs(gameObjects);
            const approchingObsticle = this.isApproachingObsticle(gameObjects);
            const approchingStairs = this.isApproachingStairs(gameObjects);

            if(closeToObsticle) {
                this.state = new JumpingState({y: -15, x: 3});
            } else if(closeToStairs) {
                this.state = new JumpingState({y: -20, x: 3});
            } else if(approchingStairs && !approchingObsticle) {
                 this.state = new CruisingState(3);
            } 

        } else   {
     
        } 

    
        this.state.update(this);
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        this.animations.update();

    }


    draw(ctx: CanvasRenderingContext2D): void {
        this.animations.draw(ctx);
    }

    private isApproachingObsticle(gameObjects: GameObject[]): boolean {
        return this.isCloseToObsticle(gameObjects, 128);
     }
    
    private isApproachingStairs(gameObjects: GameObject[]): boolean {
       return this.isCloseToStairs(gameObjects, 128);
    }

    private isCloseToStairs(gameObjects: GameObject[], diff: number = 4) {
        let minX: number = 10000;

        const skaterTranslatedX = WIDTH/2;

        for(const o of gameObjects) {
            if (o instanceof Platform && o.endYdiff > 0) {
                const x = getTranslatedPos(o.pos).x;
                if (x < minX && x > skaterTranslatedX) {
                    minX = x;
                }
            }
        }

        const diffX = minX - skaterTranslatedX; 

        return diffX < diff;
    }

    private isCloseToObsticle(gameObjects: GameObject[], diff: number = 32): boolean {

        let minX: number = 10000;
  
        const skaterTranslatedX = WIDTH / 2;

        for(const o of gameObjects) {
            if (o instanceof Obsticle) {
                const x = getTranslatedPos(o.pos).x;
                if (x < minX && x > skaterTranslatedX) {
                    minX = x;
             
                }
            }
        }

        const diffX = minX - skaterTranslatedX; 

        return diffX < diff;
    }

}