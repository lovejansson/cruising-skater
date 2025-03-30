
import { Collision } from "./collision";
import { gameObjects, getTranslatedPos, WIDTH } from "./main";
import { Obsticle } from "./Obsticle";
import { Platform } from "./Platform";
import { DynamicObject, GameObject, Point } from "./types";
import "./array";
import AudioPlayer from "./AudioPlayer";

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
 
        if(this.jumpFrame === 0) {
            AudioPlayer.getInstance().playAudio("jump");
        }

        if (this.jumpFrame > 0 && skater.isBlockedDown) {
            AudioPlayer.getInstance().stopAudio("jump");
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
        const audioplayer = AudioPlayer.getInstance();

        if(skater.isBlockedDown) {
            if(skater.isOnPlatform) {
                if(skater.isCloseToObsticle(gameObjects)) {
                    audioplayer.stopAudio("cruising");
                    audioplayer.stopAudio("sliding");
                    skater.state = new JumpingState({y: -15, x: 3}, JumpingState.obsticleTricks.random());

                } else if(skater.isCloseToStairs(gameObjects)) {
                    audioplayer.stopAudio("cruising");
                    audioplayer.stopAudio("sliding");
                    skater.state = new JumpingState({y: -15, x: 5}, JumpingState.stairsTricks.random());
                } else {
                    audioplayer.stopAudio("sliding");
                    audioplayer.playAudio("cruising", true);
                }

            } else {
                audioplayer.stopAudio("cruising");
                audioplayer.playAudio("sliding", true);
            }

            skater.vel.y = 0;

        } else {
            audioplayer.stopAudio("cruising");
            audioplayer.stopAudio("sliding");
            const doTrick = Math.random() > 0.75 && !skater.isCloseToStairs(gameObjects, 128);
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

export class Skater extends DynamicObject {

    state: SkaterState;
    isBlockedDown: boolean;
    isOnPlatform: boolean;
    isOnObsticle: boolean;
   
    constructor(pos: Point, vel: Point, width: number, height: number) {
        super(pos, vel, width, height);

        this.state = new CruisingState(2);
        this.isBlockedDown = false;
        this.isOnPlatform = false;
        this.isOnObsticle = false;

        for(let i = 0; i < 6; ++i) {
            this.animations.create(`skater-jump${i + 1}`, {loop: true, frames: `skater-jump${i + 1}`, numberOfFrames: 4});
        }

        this.animations.create("skater-cruise", {loop: true, frames: ["skater-cruise"]});

        this.animations.play("skater-cruise");
    }

    update(collisions: Collision[]): void {
        this.updateStateBasedOnCollisions(collisions);
        this.state.update(this);
        this.animations.update();
    }

    isJumping(){
        return this.state instanceof JumpingState;
    }

    private updateStateBasedOnCollisions(collisions: Collision[]) {
        this.isBlockedDown = false;

        this.isOnObsticle = false;

        this.isOnPlatform = false;

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
                this.isOnObsticle = c.obj instanceof Obsticle;
                this.isOnPlatform = c.obj instanceof Platform;
                const y = (c.obj as (Obsticle | Platform)).y(this);
                this.pos.y =  y - this.height;
            }
        }

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

    isCloseToObsticle(gameObjects: GameObject[], diff: number = 32): boolean {

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