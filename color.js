export function toRGBFromHex(hex) {
  if (!/^#[\da-fA-F]{6}$/.test(hex)) throw new Error(`Invalid hex string ${hex}. Expected example: #101010`);

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return { r, g, b };
}

export function toHSLFromHex(hex) {
  const rgb = toRGBFromHex(hex);
  return toHSLFromRGB(rgb);
}

export function toHSLFromRGB(rgb) {
  const { r, g, b } = rgb;

  // Normalize RGB values to the range 0-1
  const rNormalized = r / 255;
  const gNormalized = g / 255;
  const bNormalized = b / 255;

  const max = Math.max(rNormalized, gNormalized, bNormalized);
  const min = Math.min(rNormalized, gNormalized, bNormalized);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta !== 0) {
      // Saturation
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      // Hue
      if (max === rNormalized) {
          h = (gNormalized - bNormalized) / delta;
      } else if (max === gNormalized) {
          h = (bNormalized - rNormalized) / delta + 2;
      } else {
          h = (rNormalized - gNormalized) / delta + 4;
      }

      h = (h / 6 + (h < 0 ? 1 : 0)) * 360;
  }

  // Convert to percentage
  s *= 100;
  l *= 100;

  return {
      h: Math.round(h),
      s: Math.round(s),
      l: Math.round(l),
  };
}

export function toRGBFromHSL(hsl) {
  let { h, s, l } = hsl;

  // Normalize saturation and lightness
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
      // Achromatic case (gray)
      r = g = b = Math.round(l * 255);
  } else {
      const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); // Second largest component
      const m = l - c / 2; // Match to lightness

      let r1 = 0, g1 = 0, b1 = 0;

      // Determine RGB based on hue
      if (h >= 0 && h < 60) {
          r1 = c;
          g1 = x;
          b1 = 0;
      } else if (h >= 60 && h < 120) {
          r1 = x;
          g1 = c;
          b1 = 0;
      } else if (h >= 120 && h < 180) {
          r1 = 0;
          g1 = c;
          b1 = x;
      } else if (h >= 180 && h < 240) {
          r1 = 0;
          g1 = x;
          b1 = c;
      } else if (h >= 240 && h < 300) {
          r1 = x;
          g1 = 0;
          b1 = c;
      } else {
          r1 = c;
          g1 = 0;
          b1 = x;
      }

      // Apply m to get the final RGB values
      r = Math.round((r1 + m) * 255);
      g = Math.round((g1 + m) * 255);
      b = Math.round((b1 + m) * 255);
  }

  return { r, g, b };
}