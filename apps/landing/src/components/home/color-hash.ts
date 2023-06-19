import ColorHash from "color-hash";

export const colorHash = new ColorHash({
  hue: [{ min: 185, max: 320 }],
  lightness: [0.65],
  saturation: 0.8,
});

type RGBColor = [number, number, number];

const avatarBackgroundColors: RGBColor[] = [
  [255, 135, 160],
  [255, 179, 71],
  [255, 95, 95],
  [240, 128, 128],
  [255, 160, 122],
  [255, 192, 203],
  [230, 230, 250],
  [173, 216, 230],
  [176, 224, 230],
  [106, 90, 205],
  [123, 104, 238],
  [147, 112, 219],
  [138, 43, 226],
  [148, 0, 211],
  [153, 50, 204],
  [139, 0, 139],
  [75, 0, 130],
  [72, 61, 139],
  [219, 39, 119],
  [236, 72, 153],
];

function isBright(color: RGBColor): boolean {
  const [r, g, b] = color;
  const L = (0.2126 * r) / 255 + (0.7152 * g) / 255 + (0.0722 * b) / 255;
  return L > 0.6 ? true : false;
}

export const getRandomAvatarColor = (str: string) => {
  const strSum = str.split("").reduce((acc, val) => acc + val.charCodeAt(0), 0);
  const randomIndex = strSum % avatarBackgroundColors.length;
  const color = avatarBackgroundColors[randomIndex];
  const [r, g, b] = color;
  return { color: `rgb(${r}, ${g}, ${b})`, requiresDarkText: isBright(color) };
};

export const generateGradient = (s: string): string => {
  const s1 = s.substring(0, s.length / 2);
  const s2 = s.substring(s.length / 2);
  const c1 = colorHash.hex(s1);
  const c2 = colorHash.hex(s2);

  return `linear-gradient(45deg, ${c1}, ${c2})`;
};
