import { gameObjects, getTranslatedPos, WIDTH } from "./index.js";
import { Obsticle } from "./Obsticle.js";
import { Platform } from "./Platform.js";
import "./array.js";
import { Sprite } from "./pim-art/index.js";

/**
 * @typedef  {{obj: GameObject, blocked: {
* top: boolean,
* right: boolean,
* bottom: boolean,
* left: boolean}}} CollisionResult
*/

/**
 * Base class for skater states.
 */
class SkaterState {
    /**
     * Updates the skater's state.
     * This method should be overridden by subclasses.
     * @param {Skater} skater - The skater object.
     */
    update(skater) {
        throw new Error("update() must be implemented by subclasses");
    }
}

/**
 * Represents the jumping state of the skater.
 * Extends the `SkaterState` class.
 */
class JumpingState extends SkaterState {
    #jumpFrame;
    #vel;
    #trick;

    /**
     * @type {string[]} Tricks for obstacles.
     */
    static obsticleTricks = Array(4).fill(0).map((_, idx) => `skater-jump${idx + 1}`);

    /**
     * @type {string[]} Tricks for stairs.
     */
    static stairsTricks = Array(6).fill(0).map((_, idx) => `skater-jump${idx + 1}`);

    /**
     * @param {{x: number, y: number}} vel - The velocity of the skater during the jump.
     * @param {string} trick - The trick animation to play during the jump.
     */
    constructor(vel, trick) {
        super();
        this.#jumpFrame = 0;
        this.#vel = vel;
        this.#trick = trick;
    }

    /**
     * Updates the skater's state during the jump.
     * @param {Skater} skater - The skater object.
     */
    update(skater) {
        if (this.#jumpFrame === 0) {
            skater.scene.art.audio.play("jump");
        }

        if (this.#jumpFrame > 0 && skater.isBlockedDown) {
            skater.scene.art.audio.stop("jump");
            skater.state = new CruisingState(2);
            skater.vel.y = 0;
            return;
        }

        this.#jumpFrame++;

        const g = 2; // Gravity
        const vi = this.#vel.y;

        skater.vel.x = this.#vel.x;
        skater.vel.y = vi + g * this.#jumpFrame;

        skater.pos.x += skater.vel.x;
        skater.pos.y += skater.vel.y;

        if (!skater.animations.isPlaying(this.#trick)) {
            skater.animations.play(this.#trick);
        }
    }
}

/**
 * Represents the cruising state of the skater.
 * Extends the `SkaterState` class.
 */
class CruisingState extends SkaterState {
    #velX;

    /**
     * @param {number} velX - The horizontal velocity of the skater.
     */
    constructor(velX) {
        super();
        this.#velX = velX;
    }

    /**
     * Updates the skater's state during cruising.
     * @param {Skater} skater - The skater object.
     */
    update(skater) {
        skater.vel.x = this.#velX;

        if (skater.isBlockedDown) {
            if (skater.isOnPlatform) {
                if (skater.isCloseToObsticle(gameObjects)) {
                    skater.scene.art.audio.stop("cruising");
                    skater.scene.art.audio.stop("sliding");
                    skater.state = new JumpingState({ y: -15, x: 3 }, JumpingState.obsticleTricks[Math.floor(Math.random() * JumpingState.obsticleTricks.length)]);
                } else if (skater.isCloseToStairs(gameObjects)) {
                    skater.scene.art.audio.stop("cruising");
                    skater.scene.art.audio.stop("sliding");
                    skater.state = new JumpingState({ y: -15, x: 5 }, JumpingState.stairsTricks[Math.floor(Math.random() * JumpingState.stairsTricks.length)]);
                } else {
                    skater.scene.art.audio.stop("sliding");
                    skater.scene.art.audio.play("cruising", true);
                }
            } else {


                     skater.scene.art.audio.stop("cruising");
                    skater.scene.art.audio.play("sliding", true);
            }

            skater.vel.y = 0;
        } else {
                skater.scene.art.audio.stop("sliding");
                skater.scene.art.audio.stop("cruising");
            const doTrick = Math.random() > 0.75 && !skater.isCloseToStairs(gameObjects, 128);
            if (doTrick) {
                const trick = JumpingState.obsticleTricks[Math.floor(Math.random() * JumpingState.obsticleTricks.length)];
                skater.state = new JumpingState({ y: -15, x: 3 }, trick);
            } else {
                skater.vel.y = 2;
            }
        }

        skater.pos.x += skater.vel.x;
        skater.pos.y += skater.vel.y;

        if (!skater.animations.isPlaying("skater-cruise")) {
            skater.animations.play("skater-cruise");
        }
    }
}

/**
 * Represents the skater in the game.
 * Extends the `Sprite` class.
 */
export class Skater extends Sprite {
    /**
     * @param {{x: number, y: number}} pos - The position of the skater.
     * @param {{x: number, y: number}} vel - The velocity of the skater.
     * @param {number} width - The width of the skater.
     * @param {number} height - The height of the skater.
     */
    constructor(pos, vel, width, height) {
        super(pos, vel, width, height);

        /**
         * @type {SkaterState} The current state of the skater.
         */
        this.state = new CruisingState(2);

        /**
         * @type {boolean} Whether the skater is blocked from moving down.
         */
        this.isBlockedDown = false;

        /**
         * @type {boolean} Whether the skater is on a platform.
         */
        this.isOnPlatform = false;

        /**
         * @type {boolean} Whether the skater is on an obstacle.
         */
        this.isOnObsticle = false;

        for (let i = 0; i < 6; ++i) {
            this.animations.create(`skater-jump${i + 1}`, { loop: true, frames: `skater-jump${i + 1}`, numberOfFrames: 4 });
        }

        this.animations.create("skater-cruise", { loop: true, frames: ["skater-cruise"] });

        this.animations.play("skater-cruise");
    }

    /**
     * Updates the skater's state and animations.
     * @param {CollisionResult[]} collisions - An array of collisions to process.
     */
    update(collisions) {
        this.updateStateBasedOnCollisions(collisions);
        this.state.update(this);
        this.animations.update();
    }

    /**
     * Checks if the skater is currently jumping.
     * @returns {boolean} True if the skater is jumping, false otherwise.
     */
    isJumping() {
        return this.state instanceof JumpingState;
    }

    /**
     * Updates the skater's state based on collisions.
     * @param {CollisionResult[]} collisions - An array of collisions to process.
     */
    updateStateBasedOnCollisions(collisions) {
        this.isBlockedDown = false;
        this.isOnObsticle = false;
        this.isOnPlatform = false;

        const collisionsSorted = collisions.sort((c1, c2) => {
            if (c1.obj instanceof Obsticle) return 1;
            if (c2.obj instanceof Obsticle) return -1;
            return 0;
        });

        for (const c of collisionsSorted) {
            if (c.obj instanceof Obsticle || c.obj instanceof Platform) {
                this.isBlockedDown = true;
                this.isOnObsticle = c.obj instanceof Obsticle;
                this.isOnPlatform = c.obj instanceof Platform;
                const y = c.obj.y(this);
                this.pos.y = y - this.height;
            }
        }
    }

    /**
     * Checks if the skater is close to stairs.
     * @param {DynamicObject[]} gameObjects - The array of game objects.
     * @param {number} [diff=4] - The distance threshold.
     * @returns {boolean} True if the skater is close to stairs, false otherwise.
     */
    isCloseToStairs(gameObjects, diff = 4) {
        let minX = 10000;
        const skaterTranslatedX = WIDTH / 2;

        for (const o of gameObjects) {
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

    /**
     * Checks if the skater is close to an obstacle.
     * @param {DynamicObject[]} gameObjects - The array of game objects.
     * @param {number} [diff=32] - The distance threshold.
     * @returns {boolean} True if the skater is close to an obstacle, false otherwise.
     */
    isCloseToObsticle(gameObjects, diff = 32) {
        let minX = 10000;
        const skaterTranslatedX = WIDTH / 2;

        for (const o of gameObjects) {
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