export class KeyListener {

    private keys: Set<string>;
    private keysDown: Set<string>;

    constructor(keys: Iterable<string>) {
        this.keys = new Set(keys);
        this.keysDown = new Set();
    }

    listen() {
        addEventListener("keydown", (e) => {
            if (this.keys.has(e.key) && !this.keysDown.has(e.key)) {
                this.keysDown.add(e.key);
            }
        });

        addEventListener("keyup", (e) => {
            if (this.keysDown.has(e.key)) {
                this.keysDown.delete(e.key);
            }
        });
    }
}