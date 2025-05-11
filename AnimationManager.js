import ImageManager from "./ImageManager.js";

/**
 * @typedef {Object} AnimationConfig
 * @property {string[] | string} frames - Array of string asset keys or a single asset key for a sprite sheet.
 * @property {boolean} loop - Whether the animation should loop.
 * @property {number} [numberOfFrames] - Optional number of frames in the animation.
 */

/**
 * Manages animations for a game object.
 */
export class AnimationManager {
    /**
     * @param {Object} obj - The game object associated with this animation manager.
     * @param {number} obj.width - The width of the game object.
     * @param {number} obj.height - The height of the game object.
     * @param {Object} obj.pos - The position of the game object.
     * @param {number} obj.pos.x - The x-coordinate of the game object.
     * @param {number} obj.pos.y - The y-coordinate of the game object.
     */
    constructor(obj) {
        /**
         * @type {Object} The game object associated with this animation manager.
         */
        this.obj = obj;

        /**
         * @type {Map<string, AnimationConfig>} A map of animation keys to their configurations.
         */
        this.animations = new Map();

        /**
         * @type {{config: AnimationConfig, key: string, currentIndex: number, frameCount: number} | null}
         * The currently playing animation, or null if no animation is playing.
         */
        this.playingAnimation = null;
    }

    /**
     * Creates a new animation and registers it with the manager.
     * @param {string} key - The unique key for the animation.
     * @param {AnimationConfig} config - The configuration for the animation.
     */
    create(key, config) {
        this.animations.set(key, config);
    }

    /**
     * Starts playing the animation associated with the given key.
     * @param {string} key - The key of the animation to play.
     * @throws {AnimationNotRegisteredError} If the animation key is not registered.
     */
    play(key) {
        const animation = this.animations.get(key);
        if (!animation) throw new AnimationNotRegisteredError(key);

        this.playingAnimation = { config: animation, key, currentIndex: 0, frameCount: 0 };
    }

    /**
     * Stops the animation associated with the given key if it is currently playing.
     * @param {string} key - The key of the animation to stop.
     */
    stop(key) {
        if (key === this.playingAnimation?.key) {
            this.playingAnimation = null;
        }
    }

    /**
     * Checks if the animation associated with the given key is currently playing.
     * @param {string} key - The key of the animation to check.
     * @returns {boolean} True if the animation is playing, false otherwise.
     */
    isPlaying(key) {
        return key === this.playingAnimation?.key;
    }

    /**
     * Updates the current animation frame. Should be called on each game loop iteration.
     */
    update() {
        if (this.playingAnimation !== null) {
            if (this.playingAnimation.frameCount === 5) {
                const { config, currentIndex } = this.playingAnimation;
                const isLastFrame =
                    (config.numberOfFrames ?? 0) - 1 === currentIndex ||
                    currentIndex === config.frames.length - 1;

                if (isLastFrame) {
                    if (!config.loop) {
                        this.playingAnimation = null;
                        return;
                    } else {
                        this.playingAnimation.currentIndex = 0;
                    }
                } else {
                    this.playingAnimation.currentIndex++;
                }

                this.playingAnimation.frameCount = 0;
            }

            this.playingAnimation.frameCount++;
        }
    }

    /**
     * Draws the current animation frame onto the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        if (this.playingAnimation) {
            const { config, currentIndex } = this.playingAnimation;

            if (typeof config.frames === "string") {
                // Sprite sheet animation
                const image = ImageManager.getInstance().get(config.frames);
                ctx.drawImage(
                    image,
                    currentIndex * this.obj.width,
                    0,
                    this.obj.width,
                    this.obj.height,
                    this.obj.pos.x,
                    this.obj.pos.y,
                    this.obj.width,
                    this.obj.height
                );
            } else {
                // Frame-by-frame animation
                const image = ImageManager.getInstance().get(config.frames[currentIndex]);
                ctx.drawImage(image, this.obj.pos.x, this.obj.pos.y);
            }
        }
    }
}

/**
 * Error thrown when an animation key is not registered.
 */
class AnimationNotRegisteredError extends Error {
    /**
     * @param {string} key - The key of the unregistered animation.
     */
    constructor(key) {
        super(`Animation: ${key} not registered.`);
    }
}