import { NotImplementedError} from "./errors.js";

/**
 * @typedef {import("./Art.js").default} Art
 */

export default class Screen {

    /**
    * @description the art object that this screen belongs to, will be set by the Art class
    * @type {Art}
    */
    art;

    constructor() {
        if (new.target === Screen) {
            throw new TypeError("Cannot construct Screen instances directly");
        }

        this.art = null; // Will be set by the Art class on initialization. 
    }

    async init(){

    }

    update() {
        throw new NotImplementedError("Screen", "update");
    }

    draw() {
        throw new NotImplementedError("Screen", "draw");
    }

}