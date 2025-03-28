
import { AnimationManager } from "./AnimationManager";
import { Collision, CollisionBox } from "./collision";
import { gameObjects, getTranslatedPos, WIDTH } from "./main";
import { Obsticle } from "./Obsticle";
import { Platform } from "./Platform";
import { GameObject, Point } from "./types";
import "./array";

interface SkaterState {
    update(skater: Skater): void;
}

class JumpingState implements SkaterState {
  
    private jumpFrame: number;
    private vel: Point;
    private trick: string;

    static obsticleTricks: string[] = Array(4).fill(0).map((_, idx) => `skater-jump${idx + 1}`);
    static stairsTricks: string[] = Array(6).fill(0).map((_, idx) => `skater-jump${idx + 1}`);

    constructor(vel: Point, trick: string){
        this.jumpFrame = 0;
        this.vel = vel;
        this.trick = trick;
    
    }

    update(skater: Skater): void {

        if (this.jumpFrame > 0 && skater.isBlockedDown) {
            skater.state = new CruisingState(2);
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

             skater.pos.x += skater.vel.x;
       skater.pos.y += skater.vel.y;

       if(!skater.animations.isPlaying(this.trick)) skater.animations.play(this.trick);
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
                const doTrick = Math.random() > 0.75 && !skater.closeToState.approachingStairs;
                if(doTrick) {
                    const trick = JumpingState.obsticleTricks.random();
                    skater.state = new JumpingState({y: -15, x: 3}, trick);
                }else {
                    skater.vel.y = 2;
                }
            }

            skater.pos.x += skater.vel.x;
            skater.pos.y += skater.vel.y;

            if(!skater.animations.isPlaying("skater-cruise")) skater.animations.play("skater-cruise");
    }
}

export class Skater implements GameObject {

    pos: Point;
    width: number;
    height: number;
    vel: Point;
    animations: AnimationManager;

    public id: string;
    public type: string;

    state: SkaterState;
    isBlockedDown: boolean;

    closeToState: {
        closeToStairs: boolean;
        closeToObsticle: boolean;
        approachingStairs: boolean;
        approachingObsticle: boolean;
    }
   
    constructor(pos: Point, vel: Point) {

        this.pos = pos;
        this.vel = vel;
        this.type = "skater";
        this.id = "skater";

        this.width = 20;
        this.height = 32;
        this.state = new CruisingState(2);
        this.isBlockedDown = false;
        this.closeToState = {
            closeToObsticle: false,
            closeToStairs: false,
            approachingObsticle: false,
            approachingStairs: false,
        };
        // Setup sprite animations
        
        this.animations = new AnimationManager(this);

        for(let i = 0; i < 6; ++i) {
            this.animations.create(`skater-jump${i + 1}`, {loop: true, frames: `skater-jump${i + 1}`, numberOfFrames: 4});

        }

        this.animations.create("skater-cruise", {loop: true, frames: ["skater-cruise"]});
    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, width: this.width, height: this.height }
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

            this.closeToState.closeToObsticle = this.isCloseToObsticle(gameObjects);
            this.closeToState.closeToStairs = this.isCloseToStairs(gameObjects);
            this.closeToState.approachingObsticle = this.isApproachingObsticle(gameObjects);
            this.closeToState.approachingStairs = this.isApproachingStairs(gameObjects);

            if(this.closeToState.closeToObsticle) {
                this.state = new JumpingState({y: -15, x: 3}, JumpingState.obsticleTricks.random());
            } else if(this.closeToState.closeToStairs) {
                this.state = new JumpingState({y: -15, x: 5}, JumpingState.stairsTricks.random());
            } else if(this.closeToState.approachingStairs && !this.closeToState.approachingObsticle) {
                 this.state = new CruisingState(2);
            } 

        } else   {
     
        } 

        this.state.update(this);
        this.animations.update();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.animations.draw(ctx);
    }

    private isJumping(){
        return this.state instanceof JumpingState;
    }

    private isApproachingObsticle(gameObjects: GameObject[]): boolean {
        return this.isCloseToObsticle(gameObjects, 128);
    }
    
    private isApproachingStairs(gameObjects: GameObject[]): boolean {
       return this.isCloseToStairs(gameObjects, 128);
    }

     isCloseToStairs(gameObjects: GameObject[], diff: number = 4) {
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