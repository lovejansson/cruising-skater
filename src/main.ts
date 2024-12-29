import { Platform } from "./Platform";
import { Skater } from "./Skater";
import "./style.css"
import { Collision, GameObject } from "./types";
import AssetManager from "./AssetManager";
import { DummyObj } from "./DummyObj";

export let keysDown = new Set();

let listenToKeys = new Set([" ", "a", "d"]);

export let gameObjects: GameObject[] = [];
let lights: GameObject[] = [];

const pPlayerPos = document.querySelector("#p-player-pos");
const pPlatformPos = document.querySelector("#p-platforms-pos");
const pCanvasState = document.querySelector("#p-canvas-state");

const WIDTH = 320;
const HEIGHT = 180;

/**
 * - Generera obsticles / lampor
 * - kollisionshantering för udda objekt som inte är fyrkantiga.
 * - Separera translateY för hopp och för skifte nedåt
 * - ersätt fyrkant med spelarens animeringar för olika hopp.
 * - Gör så att bakgrunden är längre bort och mindre detaljrik/mindre hus.
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
    let translateY = skater.standingPosY - HEIGHT / 2;

    console.log(translateY)

    // Reset translation after a threshhold to avoid to big numbers. 

    const threshHold = WIDTH;

    // Pull back all game objects with threshhold pixels to reset translation values

    if (translateX >= threshHold) {
        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.x -= translateX;
        }

        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.y -= translateY;

            if ((obj instanceof Platform)) {
                obj.endY -= translateY;
            }
        }

        // Reset all objects to pos x 
        for (const obj of lights) {
            obj.pos.x -= translateX;
        }

        // Reset all objects to pos x 
        for (const obj of lights) {
            obj.pos.y -= translateY;
        }
        const latestPlatform: Platform = gameObjects[gameObjects.length - 1] as Platform;
        createPlatforms(latestPlatform.pos.x + 64, latestPlatform.endY);

        translateX = 0;
        translateY = 0;
    }

    ctxPlatform.translate(-translateX, -translateY); // Follow the player


    if (pPlayerPos && pPlatformPos && pCanvasState) {

        const currentTransform = ctxPlatform.getTransform();

        pPlayerPos.innerHTML = `Skater pos: x${skater.pos.x} y${skater.pos.y} <br/> <br/> Skater pos org: x${skater.pos.x + currentTransform.e} y${skater.pos.y + currentTransform.f}`;

        pPlatformPos.innerHTML = `Platforms range: x${gameObjects[1].pos.x} y${gameObjects[1].pos.y} - x${gameObjects[gameObjects.length - 1].pos.x} y${gameObjects[gameObjects.length - 1].pos.y} <br/> <br/>
         
        Platforms org range: x${gameObjects[1].pos.x - currentTransform.e} y${gameObjects[1].pos.y - currentTransform.f} - x${gameObjects[gameObjects.length - 1].pos.x - currentTransform.e} y${gameObjects[gameObjects.length - 1].pos.y - currentTransform.f} `;

        pCanvasState.innerHTML = `Canvas translate: x${ctxPlatform.getTransform().e} y${ctxPlatform.getTransform().f} <br/> <br/> Clearing rect: ${-currentTransform.e + ctxPlatform.canvas.width}, ${-currentTransform.f + ctxPlatform.canvas.height}`;
    }

    // Draw objects
    for (let obj of lights) {
        obj.draw(ctxPlatform);
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
    assetManager.register("platform-stairs-steep", "/stairs-steep.png");
    assetManager.register("platform-stairs-shallow", "/stairs-shallow.png");
    assetManager.register("light", "/light.png");

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


type CreatePlatformFunction = (currentX: number, currentY: number, width: number, height: number) => Platform;

/**
 * Creates a function used to choose the next platform image to use in the continous generation of platforms.  
 */
function createPlatformFunction(): CreatePlatformFunction {

    const assetManager = AssetManager.getInstance();
    const flat = assetManager.get("platform-flat");
    const stairsSteep = assetManager.get("platform-stairs-steep");
    const stairsShallow = assetManager.get("platform-stairs-shallow");

    enum PlatformTile {
        FLAT,
        STAIRS_STEEP,
        STAIRS_SHALLOW
    }


    const platformCombinationsStairs: PlatformTile[][] = [[PlatformTile.STAIRS_STEEP, PlatformTile.STAIRS_STEEP], [PlatformTile.STAIRS_STEEP, PlatformTile.STAIRS_STEEP, PlatformTile.STAIRS_STEEP], [PlatformTile.STAIRS_STEEP, PlatformTile.FLAT,
    PlatformTile.STAIRS_STEEP], [PlatformTile.STAIRS_SHALLOW, PlatformTile.FLAT, PlatformTile.STAIRS_SHALLOW]];

    const platformCombinationsFlat: PlatformTile[][] = [[PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT], [PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT],
    [PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT, PlatformTile.FLAT]];

    function getEndYForPlatform(currY: number) {
        switch (currPlatformTile) {
            case PlatformTile.FLAT:
                return currY;
            case PlatformTile.STAIRS_STEEP:
                return currY + 32;
            case PlatformTile.STAIRS_SHALLOW:
                return currY + 12;
        }
    }

    function getPlatformImage(platformTile: PlatformTile): HTMLImageElement {
        switch (platformTile) {
            case PlatformTile.FLAT:
                return flat;
            case PlatformTile.STAIRS_STEEP:
                return stairsSteep;
            case PlatformTile.STAIRS_SHALLOW:
                return stairsShallow;
        }
    }

    let currCombo = platformCombinationsFlat[0];
    let currComboIdx = 0;
    let currPlatformTile: PlatformTile = PlatformTile.FLAT;

    // Function that will be used to get the next platform 
    return function (currX: number, currY: number, width: number, height: number): Platform {

        // We've reach the end of the combination, pick new one. 
        if (currComboIdx === currCombo.length) {
            currComboIdx = 0;

            switch (currPlatformTile) {
                case PlatformTile.FLAT:
                    const i = Math.floor(Math.random() * platformCombinationsStairs.length);

                    currCombo = platformCombinationsStairs[i];
                    break;
                case PlatformTile.STAIRS_STEEP:
                case PlatformTile.STAIRS_SHALLOW:
                    const idx = Math.floor(Math.random() * platformCombinationsFlat.length);

                    currCombo = platformCombinationsFlat[idx];
                    break;
            }
        }

        currPlatformTile = currCombo[currComboIdx++];
        const endY = getEndYForPlatform(currY);

        return new Platform({ x: currX, y: currY }, width, height, endY, getPlatformImage(currPlatformTile));

    };
}


function createPlatforms(startX = 0, startY = 0) {

    const platformWidth = 64;
    const platformHeight = 144;
    const numberOfPlatformsFor1Page = (startX === 0 ? WIDTH * 2 : WIDTH) / platformWidth;

    let y = startY || 90 + 15;

    const createPlatform = createPlatformFunction();

    const light = AssetManager.getInstance().get("light");

    for (let i = 0; i < numberOfPlatformsFor1Page; ++i) {

        if (i % 2 === 0) {
            lights.push(new DummyObj({ x: startX + platformWidth * i, y: y - 64 }, 16, 64, light));
        }

        const platform = createPlatform(startX + platformWidth * i, y, platformWidth, platformHeight);

        gameObjects.push(platform);

        y = platform.endY;

    }

    // Remove platforms that will not be visible again

    if (startX !== 0) {
        gameObjects.splice(1, 5);
        lights.splice(0, 3);
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