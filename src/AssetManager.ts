export default class AssetManager {
    private static instance: AssetManager;

    private assets: Map<string, HTMLImageElement>;
    private paths: Map<string, string>;

    private constructor() {
        this.assets = new Map();
        this.paths = new Map();
    }

    /**
     * Using the singleton pattern to return and/or create an application wide instance of an asset manager
     */
    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    /**
     * Register a path to an image that will be created/loaded in load()
     */
    public register(name: string, path: string) {
        this.paths.set(name, path);
    }

    /**
     * Creates images for all paths added to the assets map in 'register'. 
     */
    public async load() {
        const loadPromises: Promise<[string, HTMLImageElement]>[] = [];

        for (const [name, path] of this.paths.entries()) {

            const image = new Image();
            const loadPromise = new Promise<[string, HTMLImageElement]>((resolve, reject) => {
                image.addEventListener("load", () => {

                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadAssetError(name, path, e.error));
                });

            });

            image.src = path;
            loadPromises.push(loadPromise);

            try {
                const loadedAssets = await Promise.all(loadPromises);
                this.assets = new Map(loadedAssets);

            } catch (e) {
                throw e;
            }

        }
    }

    /**
     * Get the specifiec image for drawing onto canvas
     */
    public get(name: string): HTMLImageElement {

        const image = this.assets.get(name);

        if (!image) throw new AssetNotLoadedError(name);

        return image;
    }

}


class AssetNotLoadedError extends Error {
    constructor(assetName: string) {
        super(`Asset: ${assetName} not loaded`);
    }
}

class LoadAssetError extends Error {
    constructor(name: string, path: string, inner: any) {
        super(`Failed to load asset: ${name} at: ${path} bc: ${inner}`);
    }
}