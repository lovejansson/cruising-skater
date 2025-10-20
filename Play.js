import { ArtObject, Sprite, Scene } from './pim-art/index.js';
import { getCollision } from './pim-art/collision.js';
import  Platform  from './Platform.js';
import { BASE_URL } from './config.js';
import Skater  from './Skater.js';
import { overlayColor } from './index.js';
import  Obsticle from './Obsticle.js';
import { drawOverlay } from './overlay.js';

export default class Play extends Scene {

    /**
     * @type {ArtObject[]}
     */
    objects;

    constructor() {
        super();
        this.objects = [];
    }

    async init() {

        await this.#loadAssets();

        this.skater = new Skater(this, { x: this.art.width / 2 - 10, y: this.art.height / 2 - 16 }, { x: 0, y: 0 }, 20, 32);

        this.generatePlatforms = this.#createGeneratePlatformsFunction();

        this.objects.push(this.skater);

        this.generatePlatforms();

        this.isInitialized = true;
    }

    update() {
        this.#updateObjects();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        const currentTransform = ctx.getTransform();

        ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.art.width, this.art.height);

        ctx.resetTransform();

        // Move camera after skater so that the skater is in the middle of the canvas all the time.
        // This is done by translating the canvas to the left since the player is going to the right.

        let skaterOrgPos = { x: this.art.width / 2 - 10, y: this.art.height / 2 - 16 };

        let translateX = this.skater.pos.x - skaterOrgPos.x;
        let translateY = this.skater.pos.y - skaterOrgPos.y;

        // Reset translation after a threshold to avoid large numbers.

        const threshHold = this.art.width;

        // Pull back all game objects by the threshold pixels to reset translation values

        if (translateX >= threshHold) {
            // Reset all objects' positions
            for (const obj of this.objects) {
                obj.pos.x -= translateX;
                obj.pos.y -= translateY;
            }

            const latestPlatform = this.objects.findLast(o => o instanceof Platform);

            this.generatePlatforms(latestPlatform.pos.x + 64, latestPlatform.pos.y + latestPlatform.endYdiff);

            translateX = 0;
            translateY = 0;
        }

        ctx.translate(-translateX, -translateY);

        this.#drawBackground(ctx);
        this.#drawPlatforms(ctx);
    }

    start() {
        this.art.audio.play("background", true);
    }

    stop() {
        this.art.ctx.resetTransform(); 
    }


    /**
     * Translates a position based on the current canvas transformation.
     * @param {{x: number, y: number}} pos - The position to translate.
     * @returns {{x: number, y: number}} The translated position.
     */
    getTranslatedPos(pos) {
        const currentTransform = this.art.ctx.getTransform();
        return { x: pos.x + currentTransform.e, y: pos.y + currentTransform.f };
    }

    #drawBackground(ctx) {
        const currentTransform = ctx.getTransform();
        ctx.drawImage(this.art.images.get("background"), 0 - currentTransform.e, 0 - currentTransform.f, this.art.width, this.art.height);
        if (overlayColor) drawOverlay(ctx, overlayColor);
    }

    #drawPlatforms(ctx) {

        const sortedGameObjects = this.objects.sort((o1, o2) => {
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

    #updateObjects() {
        for (let i = 0; i < this.objects.length; ++i) {
            const obj = this.objects[i];
            const collisions = this.#getCollisions(obj);
            if (obj instanceof Sprite) obj.update(collisions);
        }
    }

    /**
     * Gets all collisions for a given game object.
     * @param {GameObject} obj - The game object to check collisions for.
     * @returns {CollisionResult[]} An array of collisions.
     */
    #getCollisions(obj) {
        const collisions = [];

        for (let i = 0; i < this.objects.length; ++i) {
            const otherObj = this.objects[i];

            if (obj !== otherObj) {
           
                const collision = getCollision(obj, otherObj);
           
                if (collision) {
                    collisions.push(collision);
                }
            }
        }

        return collisions;
    }

    async #loadAssets() {
        this.art.images.add("background", `${BASE_URL}assets/images/background.png`);
        this.art.images.add("platform-flat", `${BASE_URL}assets/images/flat.png`);
        this.art.images.add("platform-stairs-steep", `${BASE_URL}assets/images/stairs-steep.png`);
        this.art.images.add("platform-stairs-shallow", `${BASE_URL}assets/images/stairs-shallow.png`);
        this.art.images.add("wall-stairs-shallow", `${BASE_URL}assets/images/wall-stairs-shallow.png`);
        this.art.images.add("wall-stairs-shallow-open-beginning", `${BASE_URL}assets/images/wall-stairs-shallow-open-beginning.png`);
        this.art.images.add("wall-stairs-shallow-open-end", `${BASE_URL}assets/images/wall-stairs-shallow-open-end.png`);
        this.art.images.add("wall-stairs-steep", `${BASE_URL}assets/images/wall-stairs-steep.png`);
        this.art.images.add("wall-stairs-steep-open-end", `${BASE_URL}assets/images/wall-stairs-steep-open-end.png`);
        this.art.images.add("wall-short-open-ends", `${BASE_URL}assets/images/wall-short-open-ends.png`);
        this.art.images.add("wall-stairs-steep-open-beginning", `${BASE_URL}assets/images/wall-stairs-steep-open-beginning.png`);

        this.art.images.add("wall-long", `${BASE_URL}assets/images/wall-long.png`);
        this.art.images.add("rail-short", `${BASE_URL}assets/images/rail-short.png`);
        this.art.images.add("rail-long", `${BASE_URL}assets/images/rail-long.png`);
        this.art.images.add("wall-short", `${BASE_URL}assets/images/wall-short.png`);
        this.art.images.add("wall-long", `${BASE_URL}assets/images/wall-long.png`);

        this.art.images.add("skater-cruise", `${BASE_URL}assets/images/skater-cruise.png`);

        for (let i = 0; i < 6; ++i) {
            this.art.images.add(`skater-jump${i + 1}`, `${BASE_URL}assets/images/skater-jump${i + 1}.png`);
        }

        await this.art.images.load();

        this.art.audio.add("background", `${BASE_URL}assets/audio/background.mp3`);
        this.art.audio.add("cruising", `${BASE_URL}assets/audio/cruising.mp3`);
        this.art.audio.add("sliding", `${BASE_URL}assets/audio/sliding.mp3`);
        this.art.audio.add("jump", `${BASE_URL}assets/audio/jump.wav`);
        this.art.audio.add("land", `${BASE_URL}assets/audio/land.wav`);
        this.art.audio.add("background", `${BASE_URL}assets/audio/background.mp3`);

        await this.art.audio.load();

    }


    /**
     * Creates a function used to generate the next platforms to use in the continuous generation of platforms.
     * @returns {function(number=, number=): void} A function that generates platforms starting at the given X and Y coordinates.
     */
    #createGeneratePlatformsFunction() {

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
        const next = (currX, currY) => {
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
                const obj = new Obsticle(this, { x: currX, y: currY - obsticleData.connectedToPlatformYDiff },
                    obsticleData.width,
                    obsticleData.height,
                    obsticleData.endYDiff,
                    obsticleData.assetKey
                );
             
                this.objects.push(obj);
            }

            const platformData = platformObjectData.get(currPlatform.platformTile);
            const platform = new Platform(this, { x: currX, y: currY },
                platformData.width,
                platformData.height,
                platformData.endYDiff,
                platformData.assetKey
            );

            this.objects.push(platform);

            return currY + platformData.endYDiff;
        }

        return (startX = 0, startY = 0) => {
            const platformWidth = 64;
            const numOfPlatforms = (startX === 0 ? this.art.width * 3 : this.art.width) / platformWidth;

            let y = startY || this.art.height / 2 + 16;

            for (let i = 0; i < numOfPlatforms; ++i) {
                y = next(startX + platformWidth * i, y);
            }

            this.objects = this.objects.filter(o => o.pos.x > -64);
        };
    }

}