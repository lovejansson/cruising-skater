import { Platform } from "./Platform";
import { Skater } from "./Skater";
import "./style.css"
import {  GameObject } from "./types";
import AssetManager from "./AssetManager";
import { Obsticle } from "./Obsticle";
import { Collision, getCollision } from "./collision";

export let keysDown = new Set();

let listenToKeys = new Set([" ", "a", "d"]);

export let gameObjects: GameObject[] = [];

export const WIDTH = 320;
export const HEIGHT = 180;


let ctx: CanvasRenderingContext2D;

export function getTranslatedPos(pos: {x: number, y: number}) {
    const currentTransform = ctx!.getTransform();

    return {x: pos.x + currentTransform.e, y: pos.y + currentTransform.f};
}

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
        // Reset all objects positions 
        for (const obj of gameObjects) {
            obj.pos.x -= translateX;
            obj.pos.y -= translateY;
        }

        const latestPlatform: Platform = gameObjects.findLast(o => o instanceof Platform) as Platform;

        generatePlatforms(latestPlatform.pos.x + 64, latestPlatform.pos.y + latestPlatform.endYdiff);

        translateX = 0;
        translateY = 0;
    }

    ctxPlatform.translate(-translateX, -translateY); 

    // Draw objects
    for (let obj of gameObjects) {
        if(obj instanceof Platform) {
            obj.draw(ctxPlatform);
        }
    }

    // Draw objects
    for (let obj of gameObjects) {
        if(obj instanceof Obsticle) {
            obj.draw(ctxPlatform);
        }    
    }
    
    skater.draw(ctxPlatform);

    requestAnimationFrame((elapsedMillis) => play(skater, ctxPlatform, generatePlatforms, elapsedMillis));

}


function update(elapsedMillis: number) {
    for (let i = 0; i < gameObjects.length; ++i) {
        const collisions = getCollisions(gameObjects[i]);
        gameObjects[i].update(elapsedMillis, collisions);
    }
}


/**
 * Gets collisions between game object and all other objects
 */
function getCollisions(obj: GameObject) {

    const collisions: Collision[] = [];

    let otherObj ;

    for (let i = 0; i < gameObjects.length; ++i) {

        otherObj = gameObjects[i];

        if(obj.id !== otherObj.id) {
            const collision = getCollision(obj, otherObj);

            if (collision) {
                collisions.push(collision);
            }
        } 
    }

    return collisions;
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
    assetManager.register("skater-cruise", "/skater.png");

    assetManager.register("alien", "/alien-right-spritesheet.png");

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
function createGeneratePlatformsFunction(): generatePlatformsFunction {

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
        endYDiff: number
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

    const obsticleObjectData: Map<ObsticleType, ObjectData & {connectedToPlatformYDiff: number}> = new Map([
        [ObsticleType.RAIL_LONG, { width: 128, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, image: railLong }],
        [ObsticleType.RAIL_SHORT, { width: 64, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, image: railShort }],
        [ObsticleType.WALL_LONG, { width: 128, height: 13, endYDiff: 0, connectedToPlatformYDiff: 13, image: wallLong }],
        [ObsticleType.WALL_SHORT, { width: 64, height: 13,  endYDiff: 0, connectedToPlatformYDiff: 13, image: wallShort }],
        
        [ObsticleType.WALL_STAIRS_SHALLOW, { width: 64, height: 48, endYDiff: 13, connectedToPlatformYDiff: 18, image: stairsWallShallow }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_BEGINNING, { width: 64, height: 48, endYDiff: 14, connectedToPlatformYDiff: 14, image: stairsWallShallowOpenBeginning }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_END, { width: 64, height: 48, endYDiff: 15, connectedToPlatformYDiff: 18, image: stairsWallShallowOpenEnd }],
        [ObsticleType.WALL_STAIRS_STEEP, { width: 64, height: 40, endYDiff: 29, connectedToPlatformYDiff: 12, image: wallStairsSteep }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_END, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff: 12, image: wallStairsSteepOpenEnd }],
        [ObsticleType.WALL_SHORT_OPEN_ENDS, { width: 64, height: 64, endYDiff: 1, connectedToPlatformYDiff: 14, image: wallShortOpenEnds }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_BEGINNING, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff:13, image: wallStairsSteepOpenBeginning }]]);

    const platformObjectData: Map<PlatformTile, ObjectData> = new Map([
        [PlatformTile.FLAT, { width: 64, height: 144, endYDiff: 0, image: flat }],
        [PlatformTile.STAIRS_SHALLOW, { width: 64, height: 64, endYDiff: 9, image: stairsShallow }],
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
            const obj = new Obsticle({ x: currX, y: currY -  obsticleData.connectedToPlatformYDiff}, obsticleData.width, obsticleData.height, obsticleData.endYDiff, obsticleData.image);
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
            gameObjects = gameObjects.filter(o => o.pos.x > -64);

        }
    }
}


async function init() {

    await initAssets();

    setKeyListeners();

    const skater = new Skater({ x: 160, y: 90 }, { x: 0, y: 0 });

    const canvasBackground: HTMLCanvasElement | null = document.querySelector("#canvas-background");

    const canvasPlatform: HTMLCanvasElement | null = document.querySelector("#canvas-main");

    if (canvasBackground && canvasPlatform) {

        const ctxBackground = canvasBackground.getContext("2d");

        const ctxPlatform = canvasPlatform.getContext("2d");

        if (ctxBackground && ctxPlatform) {

            const generatePlatforms = createGeneratePlatformsFunction();

            const backgroundImage = AssetManager.getInstance().get("background");

            ctxBackground.drawImage(backgroundImage, 0, 0, 320, 180);

            gameObjects.push(skater);

            generatePlatforms();

            return { ctxPlatform, skater, generatePlatforms: generatePlatforms };

        }
    }

    throw new Error("Failed to initialize canvas");
}

init().then(({ ctxPlatform, skater, generatePlatforms }) => {
    ctx = ctxPlatform;
    play(skater, ctxPlatform, generatePlatforms);
}).catch(error => console.error(error));