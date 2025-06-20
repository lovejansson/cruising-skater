import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";

/**
 * @typedef {import("./Scene.js").Scene} Scene
 */

/**
 * @typedef ArtConfig
 * 
 * @property {number} width
 * @property {number} height
 * @property {Scene} play
 * @property {Scene} pause
 * @property {string} canvas 
 * @property {number} [frameRate]
 * @property {boolean} [willReadFrequently]
 */

const FRAME_RATE_DEFAULT = 120; 
const CANVAS_SELECTOR_DEFAULT = "canvas";

/**
 * @description The main class for managing the art piece; switching between the play and pause scenes, loading assets, and managing services like images and audio. 
 */
export default class Art {

    /**
     * @type {boolean}
     */
    #isPlaying;

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
     * @type {CanvasRenderingContext2D}
     */
    ctx;

    /**
     * @param {ArtConfig} config 
     */
    constructor(config) {

        this.images = new ImagesManager();
        this.audio = new AudioPlayer();
        this.#isPlaying = false;
        this.config = config;
        this.elapsedAcc = 0; 
        this.elapsedPrev = 0; 
        this.width = config.width;
        this.height = config.height;
    }

    play() {
        this.#init().then(() => {
            this.#privatePlay(this.ctx);
        });
    }

    /**
     * @param {boolean} val
     */
    set isPlaying(val) {
        if(val) {
            this.config.play.start();
            this.config.pause.stop();
        } else {
            this.config.play.stop();
            this.config.pause.start();
        }

        this.#isPlaying = val;
    }

    get isPlaying(){
        return this.#isPlaying;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    async #privatePlay(ctx, elapsed = 0) {

        this.elapsedAcc = (this.elapsedAcc || 0) + elapsed - this.elapsedPrev;
  
        if(this.elapsedAcc >= (1000 / (this.config.frameRate || FRAME_RATE_DEFAULT))) {

            if (this.#isPlaying) {
                
                if(!this.config.play.isInitialized) {
                    await this.config.play.init();
                }

                const currentTransform = ctx.getTransform();
                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);

                this.config.play.update();
                this.config.play.draw(ctx);

            } else {
           
                if(!this.config.pause.isInitialized) {
                    await this.config.pause.init();
                }

                const currentTransform = ctx.getTransform();

                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);
            
                this.config.pause.update();
                this.config.pause.draw(ctx);
            }

            this.elapsedAcc = 0;
        }

        this.elapsedPrev = elapsed;
        requestAnimationFrame((elapsed) => this.#privatePlay(ctx, elapsed));
    }

    async #init() {

        const  ctx = this.#initCanvas(this.config.canvas || CANVAS_SELECTOR_DEFAULT);
    
        this.config.play.art = this; 
        this.config.pause.art = this; 

        this.ctx = ctx;

    }

    #initCanvas(selector) {
        const canvas = document.querySelector(selector);

        if (canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        const ctx = canvas.getContext("2d");

        if (ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        canvas.width = this.width;
        canvas.height = this.height;

        if(this.config.willReadFrequently) {
            ctx.willReadFrequently = this.config.willReadFrequently; // Enable willReadFrequently for better performance when reading pixel data frequently.
        }

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

        return ctx;

    }
}