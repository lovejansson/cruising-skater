import { AnimationManager } from "./AnimationManager.js";
import AssetManager from "./ImageManager.js";

/**
 * Base class for all game objects.
 */
export class GameObject {
    /**
     * @param {{x: number, y: number}} pos - The position of the game object.
     * @param {number} width - The width of the game object.
     * @param {number} height - The height of the game object.
     */
    constructor(pos, width, height) {
        /**
         * @type {{x: number, y: number}} The position of the game object.
         */
        this.pos = pos;

        /**
         * @type {number} The width of the game object.
         */
        this.width = width;

        /**
         * @type {number} The height of the game object.
         */
        this.height = height;

        /**
         * @type {symbol} A unique identifier for the game object.
         */
        this.id = Symbol("gameObject");
    }

    /**
     * Draws the game object on the canvas.
     * Subclasses must override this method.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @throws {Error} If the method is not implemented by a subclass.
     */
    draw(ctx) {
        throw new Error("draw() must be implemented by subclasses");
    }
}

/**
 * Represents a dynamic game object that can move and animate.
 * Extends the `GameObject` class.
 */
export class DynamicObject extends GameObject {
    /**
     * @param {{x: number, y: number}} pos - The position of the dynamic object.
     * @param {{x: number, y: number}} vel - The velocity of the dynamic object.
     * @param {number} width - The width of the dynamic object.
     * @param {number} height - The height of the dynamic object.
     */
    constructor(pos, vel, width, height) {
        super(pos, width, height);

        /**
         * @type {symbol} A unique identifier for the dynamic object.
         */
        this.id = Symbol("dynamic");

        /**
         * @type {{x: number, y: number}} The velocity of the dynamic object.
         */
        this.vel = vel;

        /**
         * @type {AnimationManager} The animation manager for the dynamic object.
         */
        this.animations = new AnimationManager(this);
    }

    /**
     * Updates the state of the dynamic object, including animations.
     */
    update() {
        this.animations.update();
    }

    /**
     * Draws the dynamic object on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        this.animations.draw(ctx);
    }
}

/**
 * Represents a static game object that does not move.
 * Extends the `GameObject` class.
 */
export class StaticObject extends GameObject {
    /**
     * @param {{x: number, y: number}} pos - The position of the static object.
     * @param {number} width - The width of the static object.
     * @param {number} height - The height of the static object.
     * @param {string} image - The key of the image asset for the static object.
     */
    constructor(pos, width, height, image) {
        super(pos, width, height);

        /**
         * @type {symbol} A unique identifier for the static object.
         */
        this.id = Symbol("static");

        /**
         * @type {HTMLImageElement} The image associated with the static object.
         */
        this.image = AssetManager.getInstance().get(image);
    }

    /**
     * Draws the static object on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        ctx.drawImage(this.image, this.pos.x, this.pos.y);
    }
}