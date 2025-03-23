import { Collision, CollisionBox } from "./collision";
import {  GameObject, Point } from "./types";

export class Platform implements GameObject {

    id: string;
    pos: Point;
    vel: Point;
    type: string;
    width: number;
    height: number;
    endYdiff: number;

    private image: HTMLImageElement;

    constructor(pos: Point, width: number, height: number, endYDiff: number, image: HTMLImageElement) {

        this.pos = pos;
        this.vel = { x: 0, y: 0 };
        this.type = "platform";
        this.id = "platform";
        this.width = width;
        this.height = height;
        this.image = image;
        this.endYdiff = endYDiff;

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, width: this.width, height: this.height }
    }

    init(): void {

    }


    /**
     * Gets the y for the current pos of x within this obj which depends on the slop of the object. 
     * @param otherObj 
     */
    y(otherObj: GameObject) {
        if(this.endYdiff === 0) return this.pos.y;

        if (otherObj.pos.x + otherObj.width < this.pos.x || otherObj.pos.x > this.pos.x + this.width) throw new Error("Other object is not within the range of this obsticle.");

        if(otherObj.pos.x < this.pos.x) return this.pos.y;
        const slope = this.endYdiff / this.width;

        return Math.round(this.pos.y + slope * (otherObj.pos.x + otherObj.width / 2 - this.pos.x));
    }

    isFlat() {
        return this.endYdiff === 0;
    }

    debug(ctx: CanvasRenderingContext2D) {

        ctx.strokeStyle = "red";
        ctx.beginPath();

        // So that the line covers one whole pixel, otherwise the belding algorithm will make it blurry
        const adjustedPosX = this.pos.x - 0.5;
        const adjustedPosY = this.pos.y - 0.5;
        const adjustedWidth = this.width + 0.5;

        if (this.endYdiff > 0) {
            ctx.moveTo(adjustedPosX, adjustedPosY);
            ctx.lineTo(adjustedPosX + 7, adjustedPosY);
            ctx.lineTo(adjustedPosX + adjustedWidth, adjustedPosY + this.endYdiff - 3);
        } else {
            ctx.moveTo(adjustedPosX, adjustedPosY);
            ctx.lineTo(adjustedPosX + adjustedWidth, adjustedPosY);
        }

        ctx.stroke();
    }

    draw(ctx: CanvasRenderingContext2D) {

        ctx.drawImage(this.image, this.pos.x, this.pos.y)
       // this.debug(ctx)
    }

    update(_: number, __: Collision[]) {

    }
}

