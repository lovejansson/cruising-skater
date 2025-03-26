import AssetManager from "./AssetManager";
import { GameObject } from "./types";

export type AnimationConfig = {
    frames: string[] | string; // Array of string asset keys or one asset key for a sprite sheet asset
    loop: boolean;
    numberOfFrames?: number;  
}


export class AnimationManager {

    private obj: GameObject;
    private animations: Map<string, AnimationConfig>;
    private playingAnimation: {config: AnimationConfig, key: string, currentIndex: number, frameCount: number  } | null;

    constructor(obj: GameObject) {
        this.obj = obj;
        this.playingAnimation = null;
        this.animations = new Map();
    }

    create(key: string, config: AnimationConfig) {
        this.animations.set(key, config);
    }

    play(key: string) {
        const animation = this.animations.get(key);
        if(!animation) throw new AnimationNotRegisteredError(key);

        this.playingAnimation = {config: animation, key, currentIndex: 0, frameCount: 0};

    }

    stop(key: string) {
        if(key === this.playingAnimation?.key) {
            this.playingAnimation = null;
        }
    }

    isPlaying(key: string) {
        return key === this.playingAnimation?.key;
    }

    update() {
        if(this.playingAnimation !== null) {
            // Change sprite frame
            if(this.playingAnimation.frameCount === 5) {
                // If is last frame check if should loop or stop 
                if((this.playingAnimation.config.numberOfFrames ?? 0) - 1 === this.playingAnimation.currentIndex 
                    || this.playingAnimation.currentIndex === this.playingAnimation.config.frames.length - 1) {
                    if(!this.playingAnimation.config.loop) {
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


    draw(ctx: CanvasRenderingContext2D) {
        if(this.playingAnimation) {

            // Is spritesheet 
            if(typeof this.playingAnimation.config.frames === "string") {
                const image = AssetManager.getInstance().get(this.playingAnimation.config.frames);
                ctx.drawImage(image, this.playingAnimation.currentIndex * this.obj.width, 0, this.obj.width, this.obj.height, this.obj.pos.x, this.obj.pos.y, this.obj.width, this.obj.height);
            } else {

                const image = AssetManager.getInstance().get(this.playingAnimation.config.frames[this.playingAnimation.currentIndex]);
                ctx.drawImage(image, this.obj.pos.x, this.obj.pos.y);

            }
          
        }
    }
}


class AnimationNotRegisteredError extends Error {
    constructor(key: string) {
        super(`Animation: ${key} not registered.`);
    }
}