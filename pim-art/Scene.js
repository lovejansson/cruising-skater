import { NotImplementedError} from "./errors.js";

/**
 * @typedef {import("./Art.js").default} Art
 */

export default class Scene {

    /**
    * @description the art object that this screen belongs to, will be set by the Art class
    * @type {Art}
    */
    art;

    /**
    * @type {boolean}
    */
    isInitialized;

    constructor() {
        if (new.target === Scene) {
            throw new TypeError("Cannot construct Screen instances directly");
        }

        this.art = null; // Will be set by the Art class on initialization. 
        this.isInitialized = false; // Will be set by the Screen subclass on initialization.
    }

    async init(){
        throw new NotImplementedError("Screen", "init");
    }

    draw() {
        throw new NotImplementedError("Screen", "draw");
    }

    update() {  
    }

    start() {
    }

    stop() {
    }

}