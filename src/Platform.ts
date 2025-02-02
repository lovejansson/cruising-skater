import { Collision, CollisionBox, CollisionLine, GameObject, Point } from "./types";

export class Platform implements GameObject {

    id: string;
    pos: Point;
    vel: Point;
    type: string;
    width: number;
    height: number;
    endYdiff: number;

    private image: HTMLImageElement;

    constructor(pos: Point, width: number, height: number, endYDiff: number, image: HTMLImageElement) {

        this.pos = pos;
        this.vel = { x: 0, y: 0 };
        this.type = "platform";
        this.id = "platform";
        this.width = width;
        this.height = height;
        this.image = image;
        this.endYdiff = endYDiff;

    }

    getCollisionBox(): CollisionBox | CollisionLine {

        if (this.endYdiff > 0) {
            return { y1: this.pos.y, x1: this.pos.x, x2: this.pos.x + this.width, y2: this.pos.y + this.endYdiff, type: "line" }
        }

        return { y: this.pos.y, x: this.pos.x, w: this.width, h: this.height, type: "box" }

    }

    init(): void {

    }

    draw(ctx: CanvasRenderingContext2D) {

        ctx.strokeStyle = "red";
        ctx.beginPath();

        // So that the line covers one whole pixel, otherwise the belding algorithm will make it blurry
        const adjustedPosX = this.pos.x - 0.5;
        const adjustedPosY = this.pos.y - 0.5;
        const adjustedWidth = this.width + 0.5;

        if (this.endYdiff > 0) {
            ctx.moveTo(adjustedPosX, adjustedPosY);
            ctx.lineTo(adjustedPosX + 7, adjustedPosY);
            ctx.lineTo(adjustedPosX + adjustedWidth, adjustedPosY + this.endYdiff - 3);
        } else {
            ctx.moveTo(adjustedPosX, adjustedPosY);
            ctx.lineTo(adjustedPosX + adjustedWidth, adjustedPosY);
        }

        ctx.stroke();

        ctx.drawImage(this.image, this.pos.x, this.pos.y)

    }

    update(_: number, __: Collision[]) {

    }
}

