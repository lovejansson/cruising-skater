import { Platform } from "./Platform";
import { Skater } from "./Skater";
import "./style.css"
import {  DynamicObject, GameObject } from "./types";
import AssetManager from "./AssetManager";
import { Obsticle } from "./Obsticle";
import { Collision, getCollision } from "./collision";
import { toHSLFromHex, toHSLFromRGB, toRGBFromHSL } from "./color";

let isPlaying = false;

export let keysDown = new Set();

let listenToKeys = new Set([" ", "a", "d"]);

let overlayColor: string = "#655b79"; 

export let gameObjects: GameObject[] = [];

export const WIDTH = 320;
export const HEIGHT = 180;

let ctx: CanvasRenderingContext2D;

export function getTranslatedPos(pos: {x: number, y: number}) {
    const currentTransform = ctx!.getTransform();

    return {x: pos.x + currentTransform.e, y: pos.y + currentTransform.f};
}

function play(skater: Skater, ctxPlatform: CanvasRenderingContext2D, ctxBackground: CanvasRenderingContext2D, generatePlatforms: generatePlatformsFunction) {

    if(isPlaying) {
        update();

        const currentTransform = ctxPlatform.getTransform();

        ctxPlatform.clearRect(0 - currentTransform.e, 0 - currentTransform.f, WIDTH, HEIGHT);

        ctxPlatform.resetTransform();

        // Move camera after skater so that the skater is in the middle of the canvas all the time. 
        // This is done by translating the canvas to the left since the player is going to the right.

        let skaterOrgPos = {x: WIDTH / 2 - 10, y: HEIGHT / 2 - 16};

        let translateX = skater.pos.x - skaterOrgPos.x;
        let translateY = skater.pos.y - skaterOrgPos.y;


        // Reset translation after a threshhold to avoid to big numbers. 

        const threshHold = WIDTH;

        // Pull back all game objects with threshhold pixels to reset translation values

        if (translateX  >= threshHold) {
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

    ctxPlatform.translate(-translateX,-translateY); 

    drawBackground(ctxBackground);
    drawPlatform(ctxPlatform);

    } else {
        
        drawBackground(ctxBackground);
        drawPlatform(ctxPlatform);
    }

    requestAnimationFrame(() => play(skater, ctxPlatform, ctxBackground, generatePlatforms));

}


function update() {

    let obj;

    for (let i = 0; i < gameObjects.length; ++i) {
        obj = gameObjects[i];
        const collisions = getCollisions(gameObjects[i]);
        if(obj instanceof DynamicObject) obj.update(collisions);
    }
}

function drawPlatform(ctx: CanvasRenderingContext2D) {

    const sortedGameObjects = gameObjects.sort((o1, o2) => {
        if(o1 instanceof Platform) {
            if(o2 instanceof Platform) return 0;
            else return -1;
        }

        if(o1 instanceof Obsticle)
            if(o2 instanceof Platform) return 1;
            else if(o2 instanceof Obsticle) return 0;
            else return -1;

        return 1;
    });

    for (let obj of sortedGameObjects) {
        obj.draw(ctx);
    }

    if(overlayColor) {
        drawOverlay(ctx, overlayColor);
    }


}


function getCollisions(obj: GameObject) {

    const collisions: Collision[] = [];

    let otherObj;

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

    const baseUrl = import.meta.env.BASE_URL;

    const assetManager = AssetManager.getInstance();

    assetManager.register("background", `${baseUrl}background.png`);
    assetManager.register("platform-flat", `${baseUrl}flat.png`);
    assetManager.register("platform-stairs-steep", `${baseUrl}stairs-steep.png`);
    assetManager.register("platform-stairs-shallow", `${baseUrl}stairs-shallow.png`);
    assetManager.register("wall-stairs-shallow", `${baseUrl}wall-stairs-shallow.png`);
    assetManager.register("wall-stairs-shallow-open-beginning", `${baseUrl}wall-stairs-shallow-open-beginning.png`);
    assetManager.register("wall-stairs-shallow-open-end", `${baseUrl}wall-stairs-shallow-open-end.png`);
    assetManager.register("wall-stairs-steep", `${baseUrl}wall-stairs-steep.png`);
    assetManager.register("wall-stairs-steep-open-end", `${baseUrl}wall-stairs-steep-open-end.png`);
    assetManager.register("wall-short-open-ends", `${baseUrl}wall-short-open-ends.png`);
    assetManager.register("wall-stairs-steep-open-beginning", `${baseUrl}wall-stairs-steep-open-beginning.png`);

    assetManager.register("wall-long", `${baseUrl}wall-long.png`);
    assetManager.register("rail-short", `${baseUrl}rail-short.png`);
    assetManager.register("rail-long", `${baseUrl}rail-long.png`);
    assetManager.register("wall-short", `${baseUrl}wall-short.png`);
    assetManager.register("wall-long", `${baseUrl}wall-long.png`);

    assetManager.register("skater-cruise", `${baseUrl}skater-cruise.png`);

    for(let i = 0; i < 6; ++i) {
        assetManager.register(`skater-jump${i + 1}`, `${baseUrl}skater-jump${i + 1}.png`)
    }

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
        assetKey: string;
        endYDiff: number
    }

    const flat = "platform-flat";

    const stairsSteep = "platform-stairs-steep";

    const stairsShallow = "platform-stairs-shallow";

    const stairsWallShallow = "wall-stairs-shallow";
    const stairsWallShallowOpenBeginning = "wall-stairs-shallow-open-beginning";
    const stairsWallShallowOpenEnd = "wall-stairs-shallow-open-end";

    const wallStairsSteep = "wall-stairs-steep";
    const wallStairsSteepOpenEnd = "wall-stairs-steep-open-end";
    const wallShortOpenEnds = "wall-short-open-ends";
    const wallStairsSteepOpenBeginning = "wall-stairs-steep-open-beginning";

    const railShort = "rail-short";
    const railLong = "rail-long";
    const wallShort = "wall-short";
    const wallLong = "wall-long";


    // Data for all objects: platforms, obsticles and rails 

    const obsticleObjectData: Map<ObsticleType, ObjectData & {connectedToPlatformYDiff: number}> = new Map([
        [ObsticleType.RAIL_LONG, { width: 128, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, assetKey: railLong }],
        [ObsticleType.RAIL_SHORT, { width: 64, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, assetKey: railShort }],
        [ObsticleType.WALL_LONG, { width: 128, height: 13, endYDiff: 0, connectedToPlatformYDiff: 13, assetKey: wallLong }],
        [ObsticleType.WALL_SHORT, { width: 64, height: 13,  endYDiff: 0, connectedToPlatformYDiff: 13, assetKey: wallShort }],
        
        [ObsticleType.WALL_STAIRS_SHALLOW, { width: 64, height: 48, endYDiff: 13, connectedToPlatformYDiff: 18, assetKey: stairsWallShallow }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_BEGINNING, { width: 64, height: 48, endYDiff: 14, connectedToPlatformYDiff: 14, assetKey: stairsWallShallowOpenBeginning }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_END, { width: 64, height: 48, endYDiff: 15, connectedToPlatformYDiff: 18, assetKey: stairsWallShallowOpenEnd }],
        [ObsticleType.WALL_STAIRS_STEEP, { width: 64, height: 40, endYDiff: 29, connectedToPlatformYDiff: 12, assetKey: wallStairsSteep }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_END, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff: 12, assetKey: wallStairsSteepOpenEnd }],
        [ObsticleType.WALL_SHORT_OPEN_ENDS, { width: 64, height: 64, endYDiff: 1, connectedToPlatformYDiff: 14, assetKey: wallShortOpenEnds }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_BEGINNING, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff:13, assetKey: wallStairsSteepOpenBeginning }]]);

    const platformObjectData: Map<PlatformTile, ObjectData> = new Map([
        [PlatformTile.FLAT, { width: 64, height: 144, endYDiff: 0, assetKey: flat }],
        [PlatformTile.STAIRS_SHALLOW, { width: 64, height: 64, endYDiff: 9, assetKey: stairsShallow }],
        [PlatformTile.STAIRS_STEEP, { width: 64, height: 64, endYDiff: 32, assetKey: stairsSteep }]]);

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


    let currCombo: { obstacle: ObsticleType, platformTile: PlatformTile }[] = flatPlatformCombinations[1];
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
            const obj = new Obsticle({ x: currX, y: currY -  obsticleData.connectedToPlatformYDiff}, obsticleData.width, obsticleData.height, obsticleData.endYDiff, obsticleData.assetKey);
            gameObjects.push(obj);
        }
        // Create platform object

        const platformData = platformObjectData.get(currPlatform.platformTile)!;

        const platform = new Platform({ x: currX, y: currY }, platformData.width, platformData.height, platformData.endYDiff, platformData.assetKey);

        gameObjects.push(platform);

        // Return y to place next platform
        return currY + platformData.endYDiff;

    };


    return function (startX: number = 0, startY: number = 0): void {

        const platformWidth = 64;

        // Create platforms that so that it always cover 3 * canvas WIDTHS 

        const numOfPlatforms = (startX === 0 ? WIDTH * 3 : WIDTH) / platformWidth;

        let y = startY || HEIGHT / 2 + 16;

        for (let i = 0; i < numOfPlatforms; ++i) {
            y = next(startX + platformWidth * i, y);
        }

        // Remove platforms that will not be visible again

        gameObjects = gameObjects.filter(o => o.pos.x > -64);
    }
}


function drawBackground(ctx: CanvasRenderingContext2D) {
    const backgroundImage = AssetManager.getInstance().get("background");

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);

    if(overlayColor) {
        drawOverlay(ctx, overlayColor);
    }
}

function drawOverlay(ctx: CanvasRenderingContext2D, overlayColor: string) {

     // Get hue value from chosen hex string
     const color = toHSLFromHex(overlayColor);
            
     const canvasImageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

     let r= 0;
     let g = 0;
     let b = 0;
     let hsl = {h: 0, s: 0, l: 0};
     let rgb = {r, g, b};

     // Update each pixel with new hue
     for(let i = 0; i < canvasImageData.data.length; i += 4) {

         r = canvasImageData.data[i];
         g = canvasImageData.data[i + 1];
         b = canvasImageData.data[i  + 2];

         hsl = toHSLFromRGB({r, g, b});
     
         hsl.h = color.h;
         hsl.s = color.s;

          rgb = toRGBFromHSL({h: hsl.h, s: hsl.s, l: hsl.l});

         canvasImageData.data[i] = rgb.r;
         canvasImageData.data[i + 1] = rgb.g;
         canvasImageData.data[i + 2] = rgb.b;
     }

     ctx.putImageData(canvasImageData,0 , 0);
}

async function init() {

    await initAssets();

    setKeyListeners();

    const skater = new Skater({ x: WIDTH / 2 - 10, y: HEIGHT / 2 - 16  }, { x: 0, y: 0 }, 20, 32);

    const canvasBackground: HTMLCanvasElement | null = document.querySelector("#canvas-background");

    const canvasPlatform: HTMLCanvasElement | null = document.querySelector("#canvas-main");

    const inputColor: HTMLInputElement | null = document.querySelector("#input-color");

    const app: HTMLBodyElement | null = document.querySelector("#app");

    if (canvasBackground && canvasPlatform && inputColor && app) {

        const ctxBackground = canvasBackground.getContext("2d");

        const ctxPlatform = canvasPlatform.getContext("2d");

        if (ctxBackground && ctxPlatform) {

            inputColor.addEventListener("change", (e) => {
           
                if((e.target as HTMLInputElement).value) overlayColor = (e.target as HTMLInputElement).value;
            });

            inputColor.value = overlayColor;

            app.addEventListener("click", () => {
                isPlaying = !isPlaying;
            })



            const generatePlatforms = createGeneratePlatformsFunction();

            drawBackground(ctxBackground);
        
            gameObjects.push(skater);

            ctx = ctxPlatform;

            generatePlatforms();

            drawPlatform(ctxPlatform);

            return { ctxPlatform, ctxBackground, skater, generatePlatforms: generatePlatforms };

        }
    }

    throw new Error("Failed to initialize canvas");
}


init().then(({ ctxPlatform, ctxBackground, skater, generatePlatforms }) => {

    play(skater, ctxPlatform, ctxBackground, generatePlatforms);
}).catch(error => console.error(error));