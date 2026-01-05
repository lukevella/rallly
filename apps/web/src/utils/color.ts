function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
): number {
  const lum1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const lum2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function lightenColor(
  rgb: { r: number; g: number; b: number },
  amount: number,
): { r: number; g: number; b: number } {
  return {
    r: rgb.r + (255 - rgb.r) * amount,
    g: rgb.g + (255 - rgb.g) * amount,
    b: rgb.b + (255 - rgb.b) * amount,
  };
}

function darkenColor(
  rgb: { r: number; g: number; b: number },
  amount: number,
): { r: number; g: number; b: number } {
  return {
    r: rgb.r * (1 - amount),
    g: rgb.g * (1 - amount),
    b: rgb.b * (1 - amount),
  };
}

export function getForegroundColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "#ffffff";

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? "#101828" : "#ffffff";
}

/**
 * Adjusts a color to ensure sufficient contrast with a background color.
 * Lightens the color for dark backgrounds and darkens it for light backgrounds.
 *
 * @param color - The color to adjust (hex format, e.g., "#084eb2")
 * @param backgroundColor - The background color to ensure contrast against (hex format, e.g., "#ffffff" or "#18181b")
 * @param minContrastRatio - Minimum contrast ratio to achieve (default: 3.0 for UI elements)
 * @returns Adjusted color in hex format
 */
export function adjustColorForContrast(
  color: string,
  backgroundColor: string,
  minContrastRatio = 3.0,
): string {
  const colorRgb = hexToRgb(color);
  const bgRgb = hexToRgb(backgroundColor);

  if (!colorRgb || !bgRgb) return color;

  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const isDarkBackground = bgLuminance < 0.5;

  let adjustedRgb = { ...colorRgb };
  let contrast = getContrastRatio(adjustedRgb, bgRgb);
  let iterations = 0;
  const maxIterations = 20;
  const step = 0.05;

  while (contrast < minContrastRatio && iterations < maxIterations) {
    if (isDarkBackground) {
      adjustedRgb = lightenColor(adjustedRgb, step);
    } else {
      adjustedRgb = darkenColor(adjustedRgb, step);
    }

    contrast = getContrastRatio(adjustedRgb, bgRgb);
    iterations++;

    if (contrast >= minContrastRatio) break;
  }

  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
}
