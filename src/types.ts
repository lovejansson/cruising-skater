import { Collision, CollisionBox } from "./collision";

export type Point = {
    x: number;
    y: number;
}

export interface GameObject {
    id: string;
    pos: Point;
    width: number;
    height: number;
    vel: Point;

    y: (otherObj: GameObject) => number;
    

    getCollisionBox: () => CollisionBox;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number, collisions: Collision[]) => boolean | void;
}
