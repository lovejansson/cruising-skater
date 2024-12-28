export type Point = {
    x: number;
    y: number;
}

export interface GameObject {
    id: string;
    pos: Point;
    vel: Point;
    type: string;

    getCollisionBox: () => CollisionBox;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number, collisions: Collision[]) => boolean | void;
}


export type Collision = {
    obj: GameObject,
    collisionPoint: "east" | "west" | "south" | "north";
}

export type CollisionBox = {
    x: number;
    w: number;
    y: number;
    h: number;
}
