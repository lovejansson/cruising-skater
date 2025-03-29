import {  GameObject, Point, StaticObject } from "./types";

export class Platform extends StaticObject {
    endYdiff: number;

    constructor(pos: Point, width: number, height: number, endYDiff: number, image: string) {
        super(pos, width, height, image);
        this.endYdiff = endYDiff;
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
}

