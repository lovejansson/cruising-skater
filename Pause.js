import { Scene } from './pim-art/index.js';
import { BASE_URL } from './config.js';
import { overlayColor } from './index.js';
import  {drawOverlay} from "./overlay.js"

export default class Pause extends Scene {

    constructor() {
        super();
    }

    async init() {
        this.art.images.add("thumbnail", `${BASE_URL}assets/images/thumbnail.png`);
        await this.art.images.load();
        this.isInitialized = true;
    }       
         
   /**
    * @param {CanvasRenderingContext2D} ctx
    */
    draw(ctx) { 
        ctx.clearRect(0, 0, this.art.width, this.art.height);
        ctx.drawImage(this.art.images.get("thumbnail"), 0, 0, this.art.width, this.art.height);

        if (overlayColor) drawOverlay(ctx, overlayColor);

    }

}