import { Platform } from "./Platform.js";
import { Skater } from "./Skater.js";
import { DynamicObject, GameObject } from "./gameObjects.js";
import AssetManager from "./ImageManager.js";
import { Obsticle } from "./Obsticle.js";
import {  getCollision } from "./collision.js";
import { toHSLFromHex, toHSLFromRGB, toRGBFromHSL } from "./color.js";
import AudioPlayer from "./AudioPlayer.js";
import { BASE_URL } from "./config.js";

let isPlaying = false;
let inputColorIsOpen = false;
let overlayColor = null;

/**
 * @type {GameObject[]} The array of game objects in the game.
 */
export let gameObjects = [];

export const WIDTH = 320;
export const HEIGHT = 180;

let ctx;

/**
 * Translates a position based on the current canvas transformation.
 * @param {{x: number, y: number}} pos - The position to translate.
 * @returns {{x: number, y: number}} The translated position.
 */
export function getTranslatedPos(pos) {
    const currentTransform = ctx.getTransform();
    return { x: pos.x + currentTransform.e, y: pos.y + currentTransform.f };
}

/**
 * Starts the game loop and handles rendering and updates.
 * @param {Skater} skater - The skater object.
 * @param {CanvasRenderingContext2D} ctxPlatform - The platform canvas context.
 * @param {CanvasRenderingContext2D} ctxBackground - The background canvas context.
 * @param {CanvasRenderingContext2D} ctxThumbnail - The thumbnail canvas context.
 * @param {Function} generatePlatforms - The function to generate platforms.
 */
function play(skater, ctxPlatform, ctxBackground, ctxThumbnail, generatePlatforms) {
    if (isPlaying) {
        const audioplayer = AudioPlayer.getInstance();

        if (!audioplayer.isOn()) {
            audioplayer.onOffSwitch();
        }

        audioplayer.playAudio("background", true);

        ctxThumbnail.clearRect(0, 0, WIDTH, HEIGHT);

        update();

        const currentTransform = ctxPlatform.getTransform();

        ctxPlatform.clearRect(0 - currentTransform.e, 0 - currentTransform.f, WIDTH, HEIGHT);

        ctxPlatform.resetTransform();

        // Move camera after skater so that the skater is in the middle of the canvas all the time.
        // This is done by translating the canvas to the left since the player is going to the right.

        let skaterOrgPos = { x: WIDTH / 2 - 10, y: HEIGHT / 2 - 16 };

        let translateX = skater.pos.x - skaterOrgPos.x;
        let translateY = skater.pos.y - skaterOrgPos.y;

        // Reset translation after a threshold to avoid large numbers.

        const threshHold = WIDTH;

        // Pull back all game objects by the threshold pixels to reset translation values

        if (translateX >= threshHold) {
            // Reset all objects' positions
            for (const obj of gameObjects) {
                obj.pos.x -= translateX;
                obj.pos.y -= translateY;
            }

            const latestPlatform = gameObjects.findLast(o => o instanceof Platform);

            generatePlatforms(latestPlatform.pos.x + 64, latestPlatform.pos.y + latestPlatform.endYdiff);

            translateX = 0;
            translateY = 0;
        }

        ctxPlatform.translate(-translateX, -translateY);

        drawBackground(ctxBackground);
        drawPlatform(ctxPlatform);

    } else {
        const audioplayer = AudioPlayer.getInstance();

        if (audioplayer.isOn()) {
            audioplayer.onOffSwitch();
            audioplayer.stopAudio("background");
        }

        ctxThumbnail.drawImage(AssetManager.getInstance().get("thumbnail"), 0, 0, WIDTH, HEIGHT);

        if (overlayColor) drawOverlay(ctxThumbnail, overlayColor);
    }

    requestAnimationFrame(() => play(skater, ctxPlatform, ctxBackground, ctxThumbnail, generatePlatforms));
}

/**
 * Updates all game objects.
 */
function update() {
    for (let i = 0; i < gameObjects.length; ++i) {
        const obj = gameObjects[i];
        const collisions = getCollisions(obj);
        if (obj instanceof DynamicObject) obj.update(collisions);
    }
}

/**
 * Draws all platforms and obstacles.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 */
function drawPlatform(ctx) {
    const sortedGameObjects = gameObjects.sort((o1, o2) => {
        if (o1 instanceof Platform) {
            if (o2 instanceof Platform) return 0;
            else return -1;
        }

        if (o1 instanceof Obsticle)
            if (o2 instanceof Platform) return 1;
            else if (o2 instanceof Obsticle) return 0;
            else return -1;

        return 1;
    });

    for (let obj of sortedGameObjects) {
        obj.draw(ctx);
    }

    if (overlayColor) drawOverlay(ctx, overlayColor);
}

/**
 * Gets all collisions for a given game object.
 * @param {GameObject} obj - The game object to check collisions for.
 * @returns {CollisionResult[]} An array of collisions.
 */
function getCollisions(obj) {
    const collisions = [];

    for (let i = 0; i < gameObjects.length; ++i) {
        const otherObj = gameObjects[i];

        if (obj.id !== otherObj.id) {
            const collision = getCollision(obj, otherObj);

            if (collision) {
                collisions.push(collision);
            }
        }
    }

    return collisions;
}

/**
 * Draws the background image and applies an overlay if specified.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 */
function drawBackground(ctx) {
    const backgroundImage = AssetManager.getInstance().get("background");

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);

    if (overlayColor) drawOverlay(ctx, overlayColor);
}

/**
 * Draws an overlay on the canvas with the specified color.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {string} overlayColor - The color of the overlay.
 */
function drawOverlay(ctx, overlayColor) {
    const color = toHSLFromHex(overlayColor);
    const canvasImageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < canvasImageData.data.length; i += 4) {
        const r = canvasImageData.data[i];
        const g = canvasImageData.data[i + 1];
        const b = canvasImageData.data[i + 2];

        const hsl = toHSLFromRGB({ r, g, b });
        hsl.h = color.h;
        hsl.s = color.s;

        const rgb = toRGBFromHSL(hsl);

        canvasImageData.data[i] = rgb.r;
        canvasImageData.data[i + 1] = rgb.g;
        canvasImageData.data[i + 2] = rgb.b;
    }

    ctx.putImageData(canvasImageData, 0, 0);
}

async function initAssets() {

    const assetManager = AssetManager.getInstance();

    assetManager.register("background", `${BASE_URL}assets/images/background.png`);
    assetManager.register("platform-flat", `${BASE_URL}assets/images/flat.png`);
    assetManager.register("platform-stairs-steep", `${BASE_URL}assets/images/stairs-steep.png`);
    assetManager.register("platform-stairs-shallow", `${BASE_URL}assets/images/stairs-shallow.png`);
    assetManager.register("wall-stairs-shallow", `${BASE_URL}assets/images/wall-stairs-shallow.png`);
    assetManager.register("wall-stairs-shallow-open-beginning", `${BASE_URL}assets/images/wall-stairs-shallow-open-beginning.png`);
    assetManager.register("wall-stairs-shallow-open-end", `${BASE_URL}assets/images/wall-stairs-shallow-open-end.png`);
    assetManager.register("wall-stairs-steep", `${BASE_URL}assets/images/wall-stairs-steep.png`);
    assetManager.register("wall-stairs-steep-open-end", `${BASE_URL}assets/images/wall-stairs-steep-open-end.png`);
    assetManager.register("wall-short-open-ends", `${BASE_URL}assets/images/wall-short-open-ends.png`);
    assetManager.register("wall-stairs-steep-open-beginning", `${BASE_URL}assets/images/wall-stairs-steep-open-beginning.png`);

    assetManager.register("wall-long", `${BASE_URL}assets/images/wall-long.png`);
    assetManager.register("rail-short", `${BASE_URL}assets/images/rail-short.png`);
    assetManager.register("rail-long", `${BASE_URL}assets/images/rail-long.png`);
    assetManager.register("wall-short", `${BASE_URL}assets/images/wall-short.png`);
    assetManager.register("wall-long", `${BASE_URL}assets/images/wall-long.png`);

    assetManager.register("skater-cruise", `${BASE_URL}assets/images/skater-cruise.png`);
    assetManager.register("thumbnail", `${BASE_URL}assets/images/thumbnail.png`);

    for (let i = 0; i < 6; ++i) {
        assetManager.register(`skater-jump${i + 1}`, `${BASE_URL}assets/images/skater-jump${i + 1}.png`);
    }

    await assetManager.load();

    const audioplayer = AudioPlayer.getInstance();

    await audioplayer.createAudio("background", `${BASE_URL}assets/audio/background.mp3`);
    await audioplayer.createAudio("cruising", `${BASE_URL}assets/audio/cruising.mp3`);
    await audioplayer.createAudio("sliding", `${BASE_URL}assets/audio/sliding.mp3`);
    await audioplayer.createAudio("jump", `${BASE_URL}assets/audio/jump.wav`);
    await audioplayer.createAudio("land", `${BASE_URL}assets/audio/land.wav`);

    audioplayer.setVolume(1);
}
/**
 * Creates a function used to choose the next platform image to use in the continuous generation of platforms.
 * @returns {function(number=, number=): void} A function that generates platforms starting at the given X and Y coordinates.
 */
function createGeneratePlatformsFunction() {
    // Enum-like objects for platform tiles, combinations, and obstacle types
    const PlatformTile = {
        FLAT: "FLAT",
        STAIRS_STEEP: "STAIRS_STEEP",
        STAIRS_SHALLOW: "STAIRS_SHALLOW"
    };

    const PlatformCombination = {
        FLAT: "FLAT",
        STAIRS: "STAIRS"
    };

    const ObsticleType = {
        RAIL_SHORT: "RAIL_SHORT",
        RAIL_LONG: "RAIL_LONG",
        WALL_SHORT: "WALL_SHORT",
        WALL_LONG: "WALL_LONG",
        WALL_STAIRS_STEEP: "WALL_STAIRS_STEEP",
        WALL_SHORT_OPEN_ENDS: "WALL_SHORT_OPEN_ENDS",
        WALL_STAIRS_STEEP_OPEN_END: "WALL_STAIRS_STEEP_OPEN_END",
        WALL_STAIRS_STEEP_OPEN_BEGINNING: "WALL_STAIRS_STEEP_OPEN_BEGINNING",
        WALL_STAIRS_SHALLOW: "WALL_STAIRS_SHALLOW",
        WALL_STAIRS_SHALLOW_OPEN_BEGINNING: "WALL_STAIRS_SHALLOW_OPEN_BEGINNING",
        WALL_STAIRS_SHALLOW_OPEN_END: "WALL_STAIRS_SHALLOW_OPEN_END",
        NONE: "NONE"
    };

    // Object data for obstacles and platforms
    const obsticleObjectData = new Map([
        [ObsticleType.RAIL_LONG, { width: 128, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, assetKey: "rail-long" }],
        [ObsticleType.RAIL_SHORT, { width: 64, height: 7, endYDiff: 0, connectedToPlatformYDiff: 7, assetKey: "rail-short" }],
        [ObsticleType.WALL_LONG, { width: 128, height: 13, endYDiff: 0, connectedToPlatformYDiff: 13, assetKey: "wall-long" }],
        [ObsticleType.WALL_SHORT, { width: 64, height: 13, endYDiff: 0, connectedToPlatformYDiff: 13, assetKey: "wall-short" }],
        [ObsticleType.WALL_STAIRS_SHALLOW, { width: 64, height: 48, endYDiff: 13, connectedToPlatformYDiff: 18, assetKey: "wall-stairs-shallow" }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_BEGINNING, { width: 64, height: 48, endYDiff: 14, connectedToPlatformYDiff: 14, assetKey: "wall-stairs-shallow-open-beginning" }],
        [ObsticleType.WALL_STAIRS_SHALLOW_OPEN_END, { width: 64, height: 48, endYDiff: 15, connectedToPlatformYDiff: 18, assetKey: "wall-stairs-shallow-open-end" }],
        [ObsticleType.WALL_STAIRS_STEEP, { width: 64, height: 40, endYDiff: 29, connectedToPlatformYDiff: 12, assetKey: "wall-stairs-steep" }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_END, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff: 12, assetKey: "wall-stairs-steep-open-end" }],
        [ObsticleType.WALL_SHORT_OPEN_ENDS, { width: 64, height: 64, endYDiff: 1, connectedToPlatformYDiff: 14, assetKey: "wall-short-open-ends" }],
        [ObsticleType.WALL_STAIRS_STEEP_OPEN_BEGINNING, { width: 64, height: 64, endYDiff: 29, connectedToPlatformYDiff: 13, assetKey: "wall-stairs-steep-open-beginning" }]
    ]);

    const platformObjectData = new Map([
        [PlatformTile.FLAT, { width: 64, height: 144, endYDiff: 0, assetKey: "platform-flat" }],
        [PlatformTile.STAIRS_SHALLOW, { width: 64, height: 64, endYDiff: 9, assetKey: "platform-stairs-shallow" }],
        [PlatformTile.STAIRS_STEEP, { width: 64, height: 64, endYDiff: 32, assetKey: "platform-stairs-steep" }]
    ]);

    const flatPlatformCombinations = [
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
        ]
    ];

    const stairsPlatformCombinations = [
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_STEEP }
        ],
        [
            { obstacle: ObsticleType.NONE, platformTile: PlatformTile.STAIRS_SHALLOW }
        ]
    ];

    let currCombo = flatPlatformCombinations[1];
    let currComboIdx = 0;
    let currPlatform = { obstacle: ObsticleType.NONE, platformTile: PlatformTile.FLAT };
    let combinationsType = PlatformCombination.FLAT;

    /**
     * Generates the next platform and obstacle.
     * @param {number} currX - The current X position.
     * @param {number} currY - The current Y position.
     * @returns {number} The new Y position for the next platform.
     */
    function next(currX, currY) {
        if (currComboIdx === currCombo.length) {
            currComboIdx = 0;

            switch (combinationsType) {
                case PlatformCombination.FLAT:
                    currCombo = stairsPlatformCombinations[Math.floor(Math.random() * stairsPlatformCombinations.length)];
                    combinationsType = PlatformCombination.STAIRS;
                    break;
                case PlatformCombination.STAIRS:
                    currCombo = flatPlatformCombinations[Math.floor(Math.random() * flatPlatformCombinations.length)];
                    combinationsType = PlatformCombination.FLAT;
                    break;
            }
        }

        currPlatform = currCombo[currComboIdx++];

        const obsticleData = obsticleObjectData.get(currPlatform.obstacle);
        if (obsticleData) {
            const obj = new Obsticle(
                { x: currX, y: currY - obsticleData.connectedToPlatformYDiff },
                obsticleData.width,
                obsticleData.height,
                obsticleData.endYDiff,
                obsticleData.assetKey
            );
            gameObjects.push(obj);
        }

        const platformData = platformObjectData.get(currPlatform.platformTile);
        const platform = new Platform(
            { x: currX, y: currY },
            platformData.width,
            platformData.height,
            platformData.endYDiff,
            platformData.assetKey
        );
        gameObjects.push(platform);

        return currY + platformData.endYDiff;
    }

    return function (startX = 0, startY = 0) {
        const platformWidth = 64;
        const numOfPlatforms = (startX === 0 ? WIDTH * 3 : WIDTH) / platformWidth;

        let y = startY || HEIGHT / 2 + 16;

        for (let i = 0; i < numOfPlatforms; ++i) {
            y = next(startX + platformWidth * i, y);
        }

        gameObjects = gameObjects.filter(o => o.pos.x > -64);
    };
}


/**
 * Initializes the game and starts the main loop.
 */
async function init() {
    await initAssets();

    const skater = new Skater({ x: WIDTH / 2 - 10, y: HEIGHT / 2 - 16 }, { x: 0, y: 0 }, 20, 32);

    const canvasBackground = document.querySelector("#canvas-background");
    const canvasPlatform = document.querySelector("#canvas-main");
    const canvasThumbnail = document.querySelector("#canvas-thumbnail");
    const inputColorContainer = document.querySelector("#input-color-container");
    const inputColor = document.querySelector("#input-color");
    const app = document.querySelector("#app");
    const audioPlayerElement = document.querySelector("audio-player");

    if (inputColorContainer && audioPlayerElement && canvasBackground && canvasPlatform && inputColor && app && canvasThumbnail) {
        audioPlayerElement.addEventListener("pause", () => {
            isPlaying = false;
            inputColor.classList.add("display-none");
        });

        audioPlayerElement.addEventListener("play", () => {
            isPlaying = true;
            inputColor.classList.remove("display-none");
        });

        audioPlayerElement.addEventListener("volume", (e) => {
            AudioPlayer.getInstance().setVolume(e.detail.volume / 100);
        });

        const ctxBackground = canvasBackground.getContext("2d", { willReadFrequently: true });
        const ctxPlatform = canvasPlatform.getContext("2d", { willReadFrequently: true });
        const ctxThumbnail = canvasThumbnail.getContext("2d", { willReadFrequently: true });

     
        if (ctxBackground && ctxPlatform && ctxThumbnail) {
            inputColorContainer.addEventListener("click", (e) => {
                if (inputColorIsOpen) {
                    e.stopPropagation();
                    inputColorIsOpen = false;
                    inputColorContainer.classList.toggle("display-none");
                }
            });

            inputColor.addEventListener("click", (e) => {
                inputColorContainer.classList.toggle("display-none");
                inputColorIsOpen = !inputColorIsOpen;
                e.stopPropagation();
            });

            inputColor.addEventListener("blur", () => {
                if (inputColorIsOpen) {
                    inputColorIsOpen = false;
                    inputColorContainer.classList.toggle("display-none");
                }
            });

            inputColor.addEventListener("change", (e) => {
                if (e.target.value) overlayColor = e.target.value;
            });

            if (overlayColor) inputColor.value = overlayColor;

            const generatePlatforms = createGeneratePlatformsFunction();

            ctxPlatform.imageSmoothingEnabled = false;
            ctxBackground.imageSmoothingEnabled = false;
            ctxThumbnail.imageSmoothingEnabled = false;

            gameObjects.push(skater);

            ctx = ctxPlatform;

            generatePlatforms();

            return { ctxThumbnail, ctxPlatform, ctxBackground, skater, generatePlatforms };
        }
    }

    throw new Error("Failed to initialize DOM");
}

init()
    .then(({ ctxPlatform, ctxBackground, ctxThumbnail, skater, generatePlatforms }) => {
        play(skater, ctxPlatform, ctxBackground, ctxThumbnail, generatePlatforms);
    })
    .catch(error => console.error(error));