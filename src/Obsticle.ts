import { Collision, CollisionBox, CollisionLine, GameObject, Point } from "./types";

export class Obsticle implements GameObject {

    id: string;
    pos: Point;
    vel: Point;
    type: string;
    width: number;
    height: number;


    private image: HTMLImageElement;

    constructor(pos: Point, width: number, height: number, image: HTMLImageElement) {
        this.pos = pos;
        this.vel = { x: 0, y: 0 };
        this.type = "platform";
        this.id = "platform";
        this.width = width;
        this.height = height;
        this.image = image;
    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, w: this.width, h: this.height, type: "box" }
    }

    init(): void {

    }

    draw(ctx: CanvasRenderingContext2D) {

        ctx.strokeStyle = "orange";

        ctx.strokeRect(this.pos.x - 0.5, this.pos.y - 0.5, this.width + 1, this.height);

        ctx.drawImage(this.image, this.pos.x, this.pos.y)
    }

    update(_: number, __: Collision[]) {

    }

}