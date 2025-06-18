import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";


/**
 * @typedef {import("./Screen.js").default} Screen
 */

/**
 * @typedef ArtConfig
 * 
 * @property {number} width
 * @property {number} height
 * @property {Screen} play
 * @property {string} pauseImage
 * @property {string} canvas
 * @property {number} [frameRate]
 */

const FRAME_RATE_DEFAULT = 60; // FPS 
const CANVAS_SELECTOR_DEFAULT = "canvas";

/**
 * @description The main class for managing the art piece; switching between play and pause scenes, loading assets, and managing services like images and audio. 
 */
export default class Art {

    /**
     * @type {boolean}
     */
    isPlaying;

    /**
     * @type {ImagesManager}
     */
    images;

    /**
     * @type {AudioPlayer}
     */
    audio;

    /**
     *  @type {ArtConfig}
     */
    config;

    /**
     * @param {ArtConfig} config 
     */
    constructor(config) {

        this.images = new ImagesManager();
        //this.audio = new AudioPlayer();
        this.isPlaying = false;
        this.config = config;
        this.elapsedAcc = 0; 
        this.elapsedPrev = 0; 
    }

    play() {
        this.#init().then(ctx => {
            this.#privatePlay(ctx);
        });
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    #privatePlay(ctx, elapsed = 0) {

        this.elapsedAcc = (this.elapsedAcc || 0) + elapsed - this.elapsedPrev;

        if(this.elapsedAcc >= (1000 / (this.config.frameRate || FRAME_RATE_DEFAULT))) {

            if (this.isPlaying) {
                ctx.clearRect(0, 0, this.config.width, this.config.height);
                this.config.play.update();
                this.config.play.draw(ctx);
            } else {

                ctx.clearRect(0, 0, this.config.width, this.config.height);
                ctx.drawImage(this.images.get(this.config.pauseImage), 0, 0, this.config.width, this.config.height);
            }

            this.elapsedAcc = 0;
        }

        this.elapsedPrev = elapsed;
        requestAnimationFrame((elapsed) => this.#privatePlay(ctx, elapsed));
    }

    async #init() {

        const canvas = document.querySelector(this.config.canvas || CANVAS_SELECTOR_DEFAULT);

        if (canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        const ctx = canvas.getContext("2d");

        if (ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        canvas.width = this.config.width;
        canvas.height = this.config.height;

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

        this.config.play.art = this; // set the art instance in the play screen

        await this.config.play.init();

        canvas.addEventListener("click", () => {
            this.isPlaying = !this.isPlaying;
        });

        return ctx;
    }
}