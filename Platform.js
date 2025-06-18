import { StaticImage } from "./pim-art/index.js";

/**
 * Represents a platform in the game.
 * Extends the `StaticObject` class.
 */
export class Platform extends StaticImage {
    /**
     * @param {{x: number, y: number}} pos - The position of the platform.
     * @param {number} width - The width of the platform.
     * @param {number} height - The height of the platform.
     * @param {number} endYDiff - The difference in the Y-coordinate at the end of the platform.
     * @param {string} image - The key of the image asset for the platform.
     */
    constructor(pos, width, height, endYDiff, image) {
        super(pos, width, height, image);

        /**
         * @type {number} The difference in the Y-coordinate at the end of the platform.
         */
        this.endYdiff = endYDiff;
    }

    /**
     * Gets the Y-coordinate for the current X-coordinate of another object within this platform.
     * The calculation depends on the slope of the platform.
     * @param {Object} otherObj - The other game object to calculate the Y-coordinate for.
     * @param {{x: number, y: number}} otherObj.pos - The position of the other object.
     * @param {number} otherObj.width - The width of the other object.
     * @returns {number} The calculated Y-coordinate.
     * @throws {Error} If the other object is not within the range of this platform.
     */
    y(otherObj) {
        if (this.endYdiff === 0) return this.pos.y;

        if (
            otherObj.pos.x + otherObj.width < this.pos.x ||
            otherObj.pos.x > this.pos.x + this.width
        ) {
            throw new Error("Other object is not within the range of this platform.");
        }

        if (otherObj.pos.x < this.pos.x) return this.pos.y;

        const slope = this.endYdiff / this.width;
        return Math.round(this.pos.y + slope * (otherObj.pos.x + otherObj.width / 2 - this.pos.x));
    }
}