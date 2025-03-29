import { AnimationManager } from "./AnimationManager";
import AssetManager from "./AssetManager";
import { Collision } from "./collision";

export type Point = {
    x: number;
    y: number;
}

export type GameObject = StaticObject | DynamicObject;

export class DynamicObject {
    id: Symbol;
    pos: Point;
    width: number;
    height: number;
    vel: Point;
    animations: AnimationManager;

    constructor(pos: Point, vel: Point, width: number, height: number) {
        this.id = Symbol("dynamic");
        this.pos = pos;
        this.vel = vel;
        this.width = width;
        this.height = height;
        this.animations = new AnimationManager(this);
    }

    update(_: Collision[]): void {
        this.animations.update();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.animations.draw(ctx);
    }
}


export class StaticObject {
    id: Symbol;
    pos: Point;
    width: number;
    height: number;
    image: HTMLImageElement;

    constructor(pos: Point, width: number, height: number, image: string) {
        this.id = Symbol("static");
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.image = AssetManager.getInstance().get(image);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.image, this.pos.x, this.pos.y)
    }
}