
import { AnimationManager } from "./AnimationManager";
import { Collision, CollisionBox } from "./collision";
import { keysDown } from "./main";
import { Obsticle } from "./Obsticle";
import { GameObject, Point } from "./types";


interface SkaterState {
    update(skater: Skater): void;
}

class JumpingState implements SkaterState {
  
    private jumpFrame: number;

    constructor(){
        this.jumpFrame = 0;
    }

    update(skater: Skater): void {

        if (this.jumpFrame > 0 && skater.isBlockedDown) {
        
            skater.state = new CruisingState();
            skater.vel.y = 0;
            return;
        } 


        this.jumpFrame++;

        // Determine velocity y

        const g = 2;
        const vi = -15;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls the skater 1 pixel downwards. t is the number of frames. 
        skater.vel.y = vi + (g * this.jumpFrame);
    }

}

class CruisingState implements SkaterState {
    update(skater: Skater): void {
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

        this.width = 16;
        this.height = 16;
        this.state = new CruisingState();
        this.isBlockedDown = false;

        // Setup sprite animations
        
        this.animations = new AnimationManager(this);
        this.animations.create("alien", {loop: true, frames: "alien", numberOfFrames: 4});
        this.animations.play("alien");

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

        let isConsideringObsticle = this.isJumping();
        
        // Sorted by placing obsticles last beacuse we want to have that as the last standing point.
        const collisionsSorted = collisions.sort((c1, c2) => {
            if(c1.obj instanceof Obsticle) return 1; 
            if(c2.obj instanceof Obsticle) return -1;
            return 0;
        
        });

        for (const c of collisionsSorted) {
            if( isConsideringObsticle || !(c.obj instanceof Obsticle)) {
                this.isBlockedDown = true;
                const y = c.obj.y(this);
                this.pos.y =  y - this.height;
            }
        }
 
    
        if (!this.isJumping() && keysDown.has(" ") && this.isBlockedDown) {
            this.state = new JumpingState();
        } 
      
        if (keysDown.has("d")) {
            this.vel.x = 4;
        } else if (keysDown.has("a")) {
            this.vel.x = -4;
        } else {
            this.vel.x = 0;
        }

        this.state.update(this);
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        this.animations.update();

    }


    draw(ctx: CanvasRenderingContext2D): void {
        this.animations.draw(ctx);
    }

}