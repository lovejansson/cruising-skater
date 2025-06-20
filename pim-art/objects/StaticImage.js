import ArtObject from "./ArtObject.js";

/** 
* @typedef {import("../Scene.js").Scene} Scene
*/

export default class StaticImage extends ArtObject {

    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(scene, pos, width, height, image) {
        super(scene, pos, width, height);
        this.image = image;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.drawImage(this.scene.art.images.get(this.image), this.pos.x, this.pos.y);
    }
}