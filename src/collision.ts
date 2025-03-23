import {   GameObject } from "./types";


export function getCollision(obj1: GameObject, obj2: GameObject): Collision | null  {

    const box1 = obj1.getCollisionBox();
    const box2 = obj2.getCollisionBox();

    const box1XEnd = box1.x + box1.width;
    const box2XEnd = box2.x + box2.width;
    const box1YEnd = box1.y + box1.height;
    const box2YEnd = box2.y + box2.height;

    // If box1 is to the left, top, right or bottom of box2 but not touching, i.e. outside of the limit of box2, they are not colliding. 
    const isColliding = !(box1XEnd < box2.x || box1YEnd < box2.y || box1.x > box2XEnd || box1.y > box2YEnd);

    if(isColliding) {

        // Calculate overlaps in Y and X direction and determine if it is a vertical collision and or a horizontal collision

        const minYEnd = Math.min(box1YEnd, box2YEnd);
        const maxYStart = Math.max(box1.y, box2.y);
        const minXEnd = Math.min(box1XEnd, box2XEnd);
        const maxXStart = Math.max(box1.x, box2.x);

        const overlapY  = minYEnd - maxYStart;
        const overlapX = minXEnd - maxXStart;

        const isVerticalCollision = overlapX >= overlapY;
        const isHorizontalCollision = overlapY >= overlapX;

        // Update the rect's blocked property

        return {obj: obj2, blocked: {
            top: isVerticalCollision && box1.y > box2.y, 
            right: isHorizontalCollision && box1.x < box2.x,
           bottom :isVerticalCollision && box1.y <= box2.y,
          left:  isHorizontalCollision && box1.x > box2.x}}
    }

    return null;
}

export type Collision = {
    obj: GameObject,
    blocked: {top: boolean, right: boolean, bottom: boolean, left: boolean}
}

export type CollisionBox = {
    x: number;
    y: number;
    width: number;
    height: number;
}
