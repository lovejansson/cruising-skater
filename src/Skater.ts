
import { keysDown } from "./main";
import { Platform } from "./Platform";
import { Collision, CollisionBox, GameObject, Point } from "./types";


export class Skater implements GameObject {

    public pos: Point;
    public vel: Point;
    public id: string;
    public type: string;

    isJumping: boolean;
    private jumpFrame: number;
    private width: number;
    private height: number;

    standingPosY: number;


    constructor(pos: Point, vel: Point) {

        this.pos = pos;
        this.vel = vel;
        this.type = "skater";
        this.id = "skater";
        this.isJumping = false;
        this.jumpFrame = 0;
        this.width = 16;
        this.height = 16;
        this.standingPosY = this.pos.y;


    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, w: this.width, h: this.height, type: "box" }
    }

    init(): void {

    }

    update(_: number, collisions: Collision[]): void {

        let isOnPlatform = false;

        for (const c of collisions) {
            if (c.collisionPoint === "south" && c.obj instanceof Platform) {
                // Align skater y position with platform
                this.pos.y = c.obj.pos.y - this.height + 1;
                isOnPlatform = true;
                break;
            }
        }

        // Start jumping
        if (!this.isJumping && keysDown.has(" ")) {

            this.isJumping = true;
            this.standingPosY = this.pos.y;
            this.updateJumpVelY();

            // Update jumping state
        } else if (this.isJumping) {
            if (isOnPlatform) {
                this.isJumping = false;
                this.vel.y = 0;
                this.jumpFrame = 0;
            } else {
                this.updateJumpVelY();
            }

        } else if (!isOnPlatform) {
            this.vel.y = 4;
        } else {
            this.vel.y = 0;
        }



        if (keysDown.has("d")) {
            this.vel.x = 4;
        } else if (keysDown.has("a")) {
            this.vel.x = -4;
        } else {
            this.vel.x = 0;
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        if (this.pos.y > this.standingPosY) {

            this.standingPosY = this.pos.y;
        }

    }

    updateJumpVelY() {

        this.jumpFrame++;

        // Determine velocity y

        const g = 2;
        const vi = -12;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls the skater 1 pixel downwards. t is the number of frames. 
        this.vel.y = vi + (g * this.jumpFrame);

    }


    draw(ctx: CanvasRenderingContext2D): void {

        ctx.fillStyle = "darkblue";

        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);

        ctx.strokeStyle = "red";
        ctx.strokeRect(this.pos.x - 0.5, this.pos.y - 0.5, this.width, this.height);


    }

}