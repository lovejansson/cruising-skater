import { Collision, CollisionBox, GameObject, Point } from "./types";

export class Platform implements GameObject {

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
        return { y: this.pos.y, x: this.pos.x, w: this.width, h: this.height }
    }

    init(): void {

    }

    draw(ctx: CanvasRenderingContext2D) {


        ctx.strokeStyle = "red";

        ctx.beginPath();
        ctx.moveTo(this.pos.x - 0.5, this.pos.y - 0.5);
        ctx.lineTo(this.pos.x - 0.5 + this.width, this.pos.y - 0.5);

        ctx.stroke();


        ctx.drawImage(this.image, this.pos.x, this.pos.y)



    }

    update(_: number, __: Collision[]) {

    }
}

