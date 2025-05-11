export default class ImageManager {

    /**
     * @type {ImageManager} The singleton instance of the ImageManager.
     */
    static instance;

    constructor() {
        /**
         * @type {Map<string, HTMLImageElement>} A map of image names to their corresponding HTMLImageElement objects.
         */
        this.assets = new Map();

        /**
         * @type {Map<string, string>} A map of image names to their file paths.
         */
        this.paths = new Map();
    }

    /**
     * Using the singleton pattern to return and/or create an application-wide instance of an image manager.
     * @returns {ImageManager} The singleton instance of the ImageManager.
     */
    static getInstance() {
        if (!ImageManager.instance) {
            ImageManager.instance = new ImageManager();
        }
        return ImageManager.instance;
    }

    /**
     * Registers a path to an image that will be created/loaded in the `load` method.
     * @param {string} name The unique name for the image.
     * @param {string} path The file path to the image.
     */
    register(name, path) {
        this.paths.set(name, path);
    }

    /**
     * Loads all registered image paths and creates HTMLImageElement objects for them.
     * @throws {LoadImageError} If any image fails to load.
     */
    async load() {
        const loadPromises = [];

        for (const [name, path] of this.paths.entries()) {
            const image = new Image();
            const loadPromise = new Promise((resolve, reject) => {
                image.addEventListener("load", () => {
                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadImageError(name, path, e.error));
                });
            });

            image.src = path;
            loadPromises.push(loadPromise);
        }

        try {
            const loadedAssets = await Promise.all(loadPromises);
            this.assets = new Map(loadedAssets);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Retrieves the specified image for drawing onto a canvas.
     * @param {string} name The unique name of the image.
     * @returns {HTMLImageElement} The HTMLImageElement associated with the given name.
     * @throws {ImageNotLoadedError} If the image with the given name is not loaded.
     */
    get(name) {
        const image = this.assets.get(name);

        if (!image) throw new ImageNotLoadedError(name);

        return image;
    }
}

/**
 * Error thrown when an image is not loaded but is requested.
 */
class ImageNotLoadedError extends Error {
    /**
     * @param {string} imageName The name of the image that was not loaded.
     */
    constructor(imageName) {
        super(`Image: ${imageName} not loaded`);
    }
}

/**
 * Error thrown when an image fails to load.
 */
class LoadImageError extends Error {
    /**
     * @param {string} name The name of the image.
     * @param {string} path The path to the image.
     * @param {any} inner The underlying error.
     */
    constructor(name, path, inner) {
        super(`Failed to load image: ${name} at: ${path} because: ${inner}`);
    }
}