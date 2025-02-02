import { Platform } from "./Platform";
import { Skater } from "./Skater";
import "./style.css"
import { Collision, GameObject, CollisionBox, CollisionLine } from "./types";
import AssetManager from "./AssetManager";
import { Obsticle } from "./Obsticle";
import Matter from "matter-js";

export let keysDown = new Set();

let listenToKeys = new Set([" ", "a", "d"]);

export let gameObjects: GameObject[] = [];

const pPlayerPos = document.querySelector("#p-player-pos");
const pPlatformPos = document.querySelector("#p-platforms-pos");
const pCanvasState = document.querySelector("#p-canvas-state");

const WIDTH = 320;
const HEIGHT = 180;





/**
 * 
 * - Kollisionshantering för udda objekt som inte är fyrkantiga.
 * 
 * - Gör så att bakgrunden är längre bort och mindre detaljrik/mindre hus.
 * - Ersätt fyrkant med spelarens animeringar för olika hopp.
 * - 
 */
function play(skater: Skater, ctxPlatform: CanvasRenderingContext2D, generatePlatforms: generatePlatformsFunction, elapsedMillis?: number) {

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
        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.x -= translateX;
        }

        // Reset all objects to pos x 
        for (const obj of gameObjects) {
            obj.pos.y -= translateY;
        }

        const latestPlatform: Platform = gameObjects[gameObjects.length - 1] as Platform;
        generatePlatforms(latestPlatform.pos.x + 64, latestPlatform.pos.y + latestPlatform.endYdiff);

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
    for (let obj of gameObjects) {
        obj.draw(ctxPlatform);
    }

    skater.draw(ctxPlatform);

    requestAnimationFrame((elapsedMillis) => play(skater, ctxPlatform, generatePlatforms, elapsedMillis));

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

            const collisionPoint = getCollision(gameObjects[index], obj);

            if (collisionPoint) {
                collisions.push({ obj, collisionPoint });
            }
        }
    }

    return collisions;
}

type CollisionPoint = "east" | "west" | "south" | "north" | null;

function getCollisionBoxLine(box: CollisionBox, line: CollisionLine): CollisionPoint {
    return null;
}

function getCollisionLineLine(line1: CollisionLine, line2: CollisionLine): CollisionPoint {
    return null;
}

function getCollisionBoxBox(box1: CollisionBox, box2: CollisionBox): CollisionPoint {

    const box1XEnd = box1.x + box1.w;
    const box1YEnd = box1.y + box1.h;
    const box2XEnd = box2.x + box2.w;
    const box2YEnd = box2.y + box2.h;

    // Check if there is a collision between the two boxes, i.e. negation of if the box is before, after, above or beneth the other box. 
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

function getCollision(obj1: GameObject, obj2: GameObject): CollisionPoint {

    const box1 = obj1.getCollisionBox();
    const box2 = obj2.getCollisionBox();

    if (box1.type === "box" && box2.type === "box") {
        return getCollisionBoxBox(box1, box2);
    } else if (box1.type === "box" && box2.type === "line") {
        return getCollisionBoxLine(box1, box2);
    }
    else if (box2.type === "box" && box1.type === "line") {
        return getCollisionBoxLine(box2, box1);
    } else if (box1.type === "line" && box2.type === "line") {
        return getCollisionLineLine(box1, box2);
    }

    return null;

}


async function initAssets() {

    const assetManager = AssetManager.getInstance();

    assetManager.register("background", "/background.png");
    assetManager.register("platform-flat", "/flat.png");
    assetManager.register("platform-stairs-steep", "/stairs-steep.png");
    assetManager.register("platform-stairs-shallow", "/stairs-shallow.png");
    assetManager.register("wall-stairs-shallow", "/wall-stairs-shallow.png");
    assetManager.register("wall-stairs-shallow-open-beginning", "/wall-stairs-shallow-open-beginning.png");
    assetManager.register("wall-stairs-shallow-open-end", "/wall-stairs-shallow-open-end.png");
    assetManager.register("wall-stairs-steep", "/wall-stairs-steep.png");
    assetManager.register("wall-stairs-steep-open-end", "/wall-stairs-steep-open-end.png");
    assetManager.register("wall-short-open-ends", "/wall-short-open-ends.png");
    assetManager.register("wall-stairs-steep-open-beginning", "/wall-stairs-steep-open-beginning.png");
    assetManager.register("wall-long", "/wall-long.png");
    assetManager.register("rail-short", "/rail-short.png");
    assetManager.register("rail-long", "/rail-long.png");
    assetManager.register("wall-short", "/wall-short.png");
    assetManager.register("wall-long", "/wall-long.png");

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


type generatePlatformsFunction = (startX?: number, startY?: number) => void;

/**
 * Creates a function used to choose the next platform image to use in the continous generation of platforms.  
 */
function generatePlatformsFunction(): generatePlatformsFunction {

    // Typings and enums used down below 

    enum PlatformTile {
        FLAT,
        STAIRS_STEEP,
        STAIRS_SHALLOW
    }

    enum PlatformCombination {
        FLAT,
        STAIRS
    }

    enum ObsticleType {
        RAIL_SHORT,
        RAIL_LONG,
        WALL_SHORT,
        WALL_LONG,
        WALL_STAIRS_STEEP,
        WALL_SHORT_OPEN_ENDS,
        WALL_STAIRS_STEEP_OPEN_END,
        WALL_STAIRS_STEEP_OPEN_BEGINNING,
        WALL_STAIRS_SHALLOW,
        WALL_STAIRS_SHALLOW_OPEN_BEGINNING,
        WALL_STAIRS_SHALLOW_OPEN_END,
        NONE
    }

    type ObjectData = {
        width: number;
        height: number;
        image: HTMLImageElement;
        yConnectingDiff?: number
    }

    // All image assets 

    const assetManager = AssetManager.getInstance();

    const flat = assetManager.get("platform-flat");

    const stairsSteep = assetManager.get("platform-stairs-steep");

    const stairsShallow = assetManager.get("platform-stairs-shallow");

    const stairsWallShallow = assetManager.get("wall-stairs-shallow");
    const stairsWallShallowOpenBeginning = assetManager.get("wall-stairs-shallow-open-beginning");
    const stairsWallShallowOpenEnd = assetManager.get("wall-stairs-shallow-open-end");

    const wallStairsSteep = assetManager.get("wall-stairs-steep");
    const wallStairsSteepOpenEnd = assetManager.get("wall-stairs-steep-open-end");
    const wallShortOpenEnds = assetManager.get("wall-short-open-ends");
    const wallStairsSteepOpenBeginning = assetManager.get("wall-stairs-steep-open-beginning");

    const railShort = AssetManager.getInstance().get("rail-short");
    const railLong = AssetManager.getInstance().get("rail-long");
    const wallShort = AssetManager.getInstance().get("wall-short");
    const wallLong = AssetManager.getInstance().get("wall-long");


    // Data for all objects: platforms, obsticles and rails 

    const obsticleObjectData: Map<ObsticleType, ObjectData> = new Map([
        [ObsticleType.RAIL_LONG, { width: 128, height: 7, image: railLong }],
        [ObsticleType.RAIL_SHORT, { width: 64, height: 7, image: railShort }],
        [ObsticleType.WALL_LONG, { width: 128, height: 13, image: wallLong }],
        [ObsticleType.WALL_SHORT, { width: 64, height: 13, image: wallShort }],
        [ObsticleType.WALL_STAIRS_SHALLOW, { width: 64, height: 48, yConnectingDiff: 18, image: stairsWallShallow }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_BEGINNING, { width: 64, height: 48, yConnectingDiff: 14, image: stairsWallShallowOpenBeginning }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_END, { width: 64, height: 48, yConnectingDiff: 18, image: stairsWallShallowOpenEnd }],
        [ObsticleType.WALL_STAIRS_STEEP, { width: 64, height: 32, yConnectingDiff: 12, image: wallStairsSteep }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_END, { width: 64, height: 64, yConnectingDiff: 12, image: wallStairsSteepOpenEnd }],
        [ObsticleType.WALL_SHORT_OPEN_ENDS, { width: 64, height: 64, yConnectingDiff: 14, image: wallShortOpenEnds }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_BEGINNING, { width: 64, height: 64, yConnectingDiff: 13, image: wallStairsSteepOpenBeginning }]]);

    const platformObjectData: Map<PlatformTile, ObjectData & { endYDiff: number }> = new Map([
        [PlatformTile.FLAT, { width: 64, height: 144, endYDiff: 0, image: flat }],
        [PlatformTile.STAIRS_SHALLOW, { width: 64, height: 64, endYDiff: 12, image: stairsShallow }],
        [PlatformTile.STAIRS_STEEP, { width: 64, height: 64, endYDiff: 32, image: stairsSteep }]]);


    const flatPlatformCombinations: { obstacle: ObsticleType, platformTile: PlatformTile }[][] = [

        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.WALL_LONG, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_LONG, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.WALL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.WALL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.RAIL_SHORT, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
        ],
    ];


    const stairsPlatformCombinations: { obstacle: ObsticleType, platformTile: PlatformTile }[][] = [
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_SHALLOW },
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP }
        ],
        [
            { obstacle: ObsticleType.WALL_STAIRS_STEEP, platformTile: PlatformTile.STAIRS_STEEP }
        ],

        [
            { obstacle: ObsticleType.WALL_STAIRS_STEEP_OPEN_END, platformTile: PlatformTile.STAIRS_STEEP },
            { obstacle: ObsticleType.WALL_SHORT_OPEN_ENDS, platformTile: PlatformTile.FLAT },
            { obstacle: ObsticleType.WALL_STAIRS_STEEP_OPEN_BEGINNING, platformTile: PlatformTile.STAIRS_STEEP }
        ],


    ];


    let currCombo: { obstacle: ObsticleType, platformTile: PlatformTile }[] = flatPlatformCombinations[0];
    let currComboIdx = 0;
    let currPlatform: { obstacle: ObsticleType, platformTile: PlatformTile } = { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT };
    let combinationsType: PlatformCombination = PlatformCombination.FLAT;

    // Function that will be used to get the next platform 
    function next(currX: number, currY: number): number {

        // We've reach the end of the combination, pick new one
        if (currComboIdx === currCombo.length) {
            currComboIdx = 0;

            // Switch between flat and stairs combination of platform tiless
            switch (combinationsType) {
                case PlatformCombination.FLAT:
                    const i = Math.floor(Math.random() * stairsPlatformCombinations.length);
                    currCombo = stairsPlatformCombinations[i];
                    combinationsType = PlatformCombination.STAIRS;
                    break;
                case PlatformCombination.STAIRS:
                    const idx = Math.floor(Math.random() * flatPlatformCombinations.length);
                    currCombo = flatPlatformCombinations[idx];
                    combinationsType = PlatformCombination.FLAT;
                    break;
            }
        }

        currPlatform = currCombo[currComboIdx++];

        // Create obsticle objects connected to the platform

        const obsticleData = obsticleObjectData.get(currPlatform.obstacle as ObsticleType);

        if (obsticleData) {
            const obj = new Obsticle({ x: currX, y: currY - (obsticleData.yConnectingDiff ?? obsticleData.height) }, obsticleData.width, obsticleData.height, obsticleData.image);
            gameObjects.push(obj);
        }
        // Create platform object

        const platformData = platformObjectData.get(currPlatform.platformTile)!;

        const platform = new Platform({ x: currX, y: currY }, platformData.width, platformData.height, platformData.endYDiff, platformData.image);

        gameObjects.push(platform);



        // Return y to place next platform
        return currY + platformData.endYDiff;

    };


    return function (startX: number = 0, startY: number = 0): void {

        const platformWidth = 64;

        // Create platforms that so that it always cover 2 * canvas WIDTHS 

        const numOfPlatforms = (startX === 0 ? WIDTH * 2 : WIDTH) / platformWidth;

        let y = startY || 90 + 15;

        for (let i = 0; i < numOfPlatforms; ++i) {
            y = next(startX + platformWidth * i, y);
        }

        // Remove platforms that will not be visible again

        if (startX !== 0) {
            gameObjects = gameObjects.filter(o => o.pos.x > -2);

        }
    }
}


async function init() {

    await initAssets();

    setKeyListeners();

    const skater = new Skater({ x: 160, y: 90 }, { x: 0, y: 0 });

    const canvasBackground: HTMLCanvasElement | null = document.querySelector("#canvas-background");

    const canvasPlatform: HTMLCanvasElement | null = document.querySelector("#canvas-platform");

    if (canvasBackground && canvasPlatform) {

        const ctxBackground = canvasBackground.getContext("2d");

        const ctxPlatform = canvasPlatform.getContext("2d");

        if (ctxBackground && ctxPlatform) {

            const generatePlatforms = generatePlatformsFunction();

            const backgroundImage = AssetManager.getInstance().get("background");

            ctxBackground.drawImage(backgroundImage, 0, 0, 320, 180);

            gameObjects.push(skater);

            generatePlatforms();

            return { ctxPlatform, skater, generatePlatforms };

        }
    }

    throw new Error("Failed to initialize");

}

init().then(({ ctxPlatform, skater, generatePlatforms }) => {
    play(skater, ctxPlatform, generatePlatforms);
});