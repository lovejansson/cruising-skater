export type Point = {
    x: number;
    y: number;
}

export interface GameObject {
    id: string;
    pos: Point;
    vel: Point;
    type: string;

    getCollisionBox: () => CollisionBox | CollisionLine;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number, collisions: Collision[]) => boolean | void;
}


export type Collision = {
    obj: GameObject,
    collisionPoint: "east" | "west" | "south" | "north";
}

export type CollisionBox = {
    type: "box";
    x: number;
    y: number;
    w: number;
    h: number;
}


export type CollisionLine = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}