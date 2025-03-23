import { Collision, CollisionBox } from "./collision";
import { GameObject, Point } from "./types";

export class Obsticle implements GameObject {

    id: string;
    pos: Point;
    vel: Point;
    width: number;
    height: number;
    endYdiff: number;


    private image: HTMLImageElement;

    constructor(pos: Point, width: number, height: number,endYDiff: number, image: HTMLImageElement) {
        this.pos = pos;
        this.vel = { x: 0, y: 0 };
        this.width = width;
        this.height = height;
        this.image = image;
        this.id = "obsticle:" + Math.random() * 10000;
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
        if(this.endYdiff === 0) return this.pos.y + 2;
        if(this.endYdiff === 1) return this.pos.y + 3;
 
 
        if (otherObj.pos.x + otherObj.width < this.pos.x || otherObj.pos.x > this.pos.x + this.width) throw new Error("Other object is not within the range of this obsticle.");
        if(otherObj.pos.x < this.pos.x) return this.pos.y;
        const slope = this.endYdiff / this.width;

        return Math.round(this.pos.y + slope * (otherObj.pos.x + otherObj.width / 2   - this.pos.x)) + 2;
    }


    draw(ctx: CanvasRenderingContext2D) {

        ctx.strokeStyle = "orange";

        ctx.drawImage(this.image, this.pos.x, this.pos.y)
     //   ctx.strokeRect(this.pos.x - 0.5, this.pos.y - 0.5, this.width + 1, this.height + 1);

    }

    update(_: number, __: Collision[]) {

    }

}