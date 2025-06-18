import { StaticImage } from "./pim-art/index.js";
/**
 * Represents an obstacle in the game.
 * Extends the `StaticObject` class.
 */
export class Obsticle extends StaticImage {
    /**
     * @param {{x: number, y: number}} pos - The position of the obstacle.
     * @param {number} width - The width of the obstacle.
     * @param {number} height - The height of the obstacle.
     * @param {number} endYDiff - The difference in the Y-coordinate at the end of the obstacle.
     * @param {string} image - The key of the image asset for the obstacle.
     */
    constructor(pos, width, height, endYDiff, image) {
        super(pos, width, height, image);

        /**
         * @type {{x: number, y: number}} The position of the obstacle.
         */
        this.pos = pos;

        /**
         * @type {number} The width of the obstacle.
         */
        this.width = width;

        /**
         * @type {number} The height of the obstacle.
         */
        this.height = height;

        /**
         * @type {number} The difference in the Y-coordinate at the end of the obstacle.
         */
        this.endYdiff = endYDiff;
    }

    /**
     * Gets the Y-coordinate for the current X-coordinate of another object within this obstacle.
     * The calculation depends on the slope of the obstacle.
     * @param {GameObject} otherObj - The other game object to calculate the Y-coordinate for.
     * @returns {number} The calculated Y-coordinate.
     * @throws {Error} If the other object is not within the range of this obstacle.
     */
    y(otherObj) {
        if (this.endYdiff === 0) return this.pos.y + 2;
        if (this.endYdiff === 1) return this.pos.y + 3;

        if (
            otherObj.pos.x + otherObj.width < this.pos.x ||
            otherObj.pos.x > this.pos.x + this.width
        ) {
            throw new Error("Other object is not within the range of this obstacle.");
        }

        if (otherObj.pos.x < this.pos.x) return this.pos.y;

        const slope = this.endYdiff / this.width;
        return Math.round(this.pos.y + slope * (otherObj.pos.x + otherObj.width / 2 - this.pos.x)) + 2;
    }
}