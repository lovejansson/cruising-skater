import { toHSLFromHex, toHSLFromRGB, toRGBFromHSL } from "./color.js";
/**
 * Draws an overlay on the canvas with the specified color.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {string} overlayColor - The color of the overlay.
 */
export function drawOverlay(ctx, overlayColor) {
    const color = toHSLFromHex(overlayColor);
    const canvasImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

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
