
import { NotImplementedError } from "../errors.js";


/** 
* @typedef {import("../Scene.js").Scene} Scene
*/

/**
 * @description the art consists of objects that can be drawn on the screen.
 */
export default class ArtObject {
    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(scene, pos, width, height) {
        this.scene = scene;
        this.pos = pos;
        this.width = width;
        this.height = height;
    }

    update() {
    }

    draw() {
        throw new NotImplementedError("ArtObject", "draw");
    }
}