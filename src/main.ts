import { Platform } from "./Platform";
import { Skater } from "./Skater";
import "./style.css"
import { Collision, GameObject } from "./types";
import AssetManager from "./AssetManager";

export let keysDown = new Set();

let listenToKeys = new Set([" ", "a", "d"]);

export let gameObjects: GameObject[] = [];

const pPlayerPos = document.querySelector("#p-player-pos");
const pPlatformPos = document.querySelector("#p-platforms-pos");
const pCanvasState = document.querySelector("#p-canvas-state");

const WIDTH = 320;
const HEIGHT = 180;

/**
 * TODO: 
 * - Fortsätt på generering av platformar så att det ser snyggt ut.
 * - Gör så att bakgrunden är längre bort och mindre detaljrik/mindre hus.
 * - kollisionshantering för udda objekt som inte är fyrkantiga
 * - ersätt fyrkant med spelarens animeringar för olika hopp 
 * 
 */


function play(skater: Skater, ctxPlatform: CanvasRenderingContext2D, elapsedMillis?: number) {

    update(elapsedMillis ?? 0);

    const currentTransform = ctxPlatform.getTransform();

    ctxPlatform.clearRect(0 - currentTransform.e, 0 - currentTransform.f, WIDTH, HEIGHT);

    ctxPlatform.resetTransform();

    // Move camera after skater so that the skater is in the middle of the canvas all the time. 
    // This is done by translating the canvas to the left since the player is going to the right.

    let translateX = skater.pos.x - WIDTH / 2;
    let translateY = skater.pos.y - HEIGHT / 2;

    // Reset translation after a threshhold to avoid to big numbers. 

    const threshHold = WIDTH;

    // Pull back all game objects with threshhold pixels to reset translation values

    if (translateX >= threshHold) {
        console.log("canvas translate ", translateX)
        console.log(JSON.parse(JSON.stringify(gameObjects)));

        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.x -= translateX;
        }

        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.y -= translateY;

        }

        console.log(gameObjects[gameObjects.length - 1].pos.x)
        createPlatforms(gameObjects[gameObjects.length - 1].pos.x + 64, gameObjects[gameObjects.length - 1].pos.y);

        console.log(JSON.parse(JSON.stringify(gameObjects)));

        translateX = 0;
        translateY = 0;
    }

    /*     if (translateY >= threshHold) {
    
            // Reset all objects to pos x 
            for (const obj of gameObjects) {
                obj.pos.y -= translateY;
    
            }
    
            translateY = 0;
        }
     */

    ctxPlatform.translate(-translateX, -translateY); // Follow the player


    if (pPlayerPos && pPlatformPos && pCanvasState) {

        const currentTransform = ctxPlatform.getTransform();

        pPlayerPos.innerHTML = `Skater pos: x${skater.pos.x} y${skater.pos.y} <br/> <br/> Skater pos org: x${skater.pos.x + currentTransform.e} y${skater.pos.y + currentTransform.f}`;

        pPlatformPos.innerHTML = `Platforms range: x${gameObjects[1].pos.x} y${gameObjects[1].pos.y} - x${gameObjects[gameObjects.length - 1].pos.x} y${gameObjects[gameObjects.length - 1].pos.y} <br/> <br/>
         
        Platforms org range: x${gameObjects[1].pos.x - currentTransform.e} y${gameObjects[1].pos.y - currentTransform.f} - x${gameObjects[gameObjects.length - 1].pos.x - currentTransform.e} y${gameObjects[gameObjects.length - 1].pos.y - currentTransform.f} `;

        pCanvasState.innerHTML = `Canvas translate: x${ctxPlatform.getTransform().e} y${ctxPlatform.getTransform().f} <br/> <br/> Clearing rect: ${-currentTransform.e + ctxPlatform.canvas.width}, ${-currentTransform.f + ctxPlatform.canvas.height}`;
    }

    // Draw objects
    for (let obj of gameObjects) {
        obj.draw(ctxPlatform);
    }

    requestAnimationFrame((elapsedMillis) => play(skater, ctxPlatform, elapsedMillis));

}


function update(elapsedMillis: number) {
    updateGameObjects(elapsedMillis);
}


function updateGameObjects(elapsedMillis: number) {

    for (const [idx, obj] of Object.entries(gameObjects)) {

        const collisions = getCollisions(parseInt(idx));

        obj.update(elapsedMillis, collisions);

    }
}


function getCollisions(index: number) {

    const collisions: Collision[] = [];

    for (const [idx, obj] of Object.entries(gameObjects)) {
        if (parseInt(idx) !== index) {

            const collisionPoint = getCollisionPoint(gameObjects[index], obj);

            if (collisionPoint) {
                collisions.push({ obj, collisionPoint });
            }
        }
    }

    return collisions;
}


function getCollisionPoint(obj1: GameObject, obj2: GameObject): "east" | "west" | "south" | "north" | null {

    const box1 = obj1.getCollisionBox();
    const box2 = obj2.getCollisionBox();

    const box1XEnd = box1.x + box1.w;
    const box1YEnd = box1.y + box1.h;
    const box2XEnd = box2.x + box2.w;
    const box2YEnd = box2.y + box2.h;

    // Check if there is a collision between the two boxes
    if (!(box1.x >= box2XEnd || box1XEnd <= box2.x || box1.y >= box2YEnd || box1YEnd <= box2.y)) {

        // Determine the side of collision by comparing the collision overlaps in y and x directions

        const box1HalfW = box1.w / 2;
        const box2HalfW = box2.w / 2;
        const box1HalfH = box1.h / 2;
        const box2HalfH = box2.h / 2;

        const box1CenterX = box1.x + box1HalfW;
        const box2CenterX = box2.x + box2HalfW;
        const box1CenterY = box1.y + box1HalfH;
        const box2CenterY = box2.y + box2HalfH;

        const distX = box1CenterX - box2CenterX;
        const distY = box1CenterY - box2CenterY;

        // The max distance between is the distance between the two centers if they where perfectly aligned with eachother side by side. If the distance is greater, it means that the boxes are not touching.
        // The boxes should be touching here since we already checked for that. So, the max distance is used to calculate the overlap in each direction. 

        const maxDistX = box1HalfW + box2HalfW;
        const maxDistY = box1HalfH + box2HalfH;


        const overlapX = distX > 0 ? maxDistX - distX : -maxDistX - distX;
        const overlapY = distY > 0 ? maxDistY - distY : -maxDistY - distY;



        if (overlapY !== 0 && overlapX !== 0) {

            // If the overlap in the y direction is bigger than in the x direction we decide that the collision accours in the x direction. Draw this out on paper to get it. 
            if (Math.abs(overlapY) > Math.abs(overlapX)) {
                // Collision in x direction



                if (overlapX > 0) {

                    return "west"
                } else {

                    return "east"
                }
            } else {


                // Collision in y direction
                if (overlapY > 0) {
                    return "north"
                }

                return "south"
            }
        }

    }

    return null;

}

async function init() {

    await initAssets();

    setKeyListeners();
}


async function initAssets() {
    const assetManager = AssetManager.getInstance();
    assetManager.register("background", "/background.png");

    assetManager.register("platform-flat", "/flat.png");
    assetManager.register("platform-stair", "/stair.png");

    await assetManager.load();
}

function setKeyListeners() {

    addEventListener("keydown", (e) => {

        if (listenToKeys.has(e.key) && !keysDown.has(e.key)) {
            keysDown.add(e.key);
        }

    });


    addEventListener("keyup", (e) => {

        if (keysDown.has(e.key)) {
            keysDown.delete(e.key);
        }

    });

}




let lastImageIsStair = false;

let numberOfSamePlatform = 0;

function createPlatforms(startX = 0, startY = 0) {

    const platformWidth = 64;

    const numberOfPlatformsFor1Page = (startX === 0 ? WIDTH * 2 : WIDTH) / platformWidth;

    console.log("START IONDEX", startX, numberOfPlatformsFor1Page)
    const assetManager = AssetManager.getInstance();

    const platformFlatImage = assetManager.get("platform-flat");
    const platformStairImage = assetManager.get("platform-stair");

    let image = platformFlatImage;

    let y = startY || 90 + 15;

    for (let i = 0; i < numberOfPlatformsFor1Page; ++i) {

        if (lastImageIsStair) {
            y += 32;
        }

        if (numberOfSamePlatform === 2) {
            if (lastImageIsStair) {
                image = platformFlatImage;
                lastImageIsStair = false;
            } else {
                image = platformStairImage;
                lastImageIsStair = true;
            }
            numberOfSamePlatform = 0;
        }



        gameObjects.push(new Platform({ x: startX + (platformWidth * i), y: y }, platformWidth, 144, image));


        numberOfSamePlatform++;

    }

    // Remove platforms that will not be visible again

    if (startX !== 0) {
        gameObjects.splice(1, 5);
    }

}


init().then(() => {

    const skater = new Skater({ x: 160, y: 90 }, { x: 0, y: 0 });

    const canvasBackground: HTMLCanvasElement | null = document.querySelector("#canvas-background");

    const canvasPlatform: HTMLCanvasElement | null = document.querySelector("#canvas-platform");

    if (canvasBackground && canvasPlatform) {

        const ctxBackground = canvasBackground.getContext("2d");

        const ctxPlatform = canvasPlatform.getContext("2d");

        if (ctxBackground && ctxPlatform) {

            const backgroundImage = AssetManager.getInstance().get("background");



            ctxBackground.drawImage(backgroundImage, 0, 0, 320, 180);


            gameObjects.push(skater);

            createPlatforms();

            play(skater, ctxPlatform);

        }
    }

});