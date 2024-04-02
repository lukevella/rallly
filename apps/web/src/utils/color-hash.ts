import ColorHash from "color-hash";

export const colorHash = new ColorHash({
  hue: [{ min: 220, max: 320 }],
  lightness: [0.65],
  saturation: 0.8,
});

type RGBColor = [number, number, number];

// Define an array of avatar background colors
const avatarBackgroundColors: RGBColor[] = [
  [147, 51, 234], //  Indigo
  [106, 0, 255], // Purple
  [255, 177, 255], // Pink
  [166, 74, 255], // Violet
  [236, 72, 153], // Pink
  [147, 51, 234], // Teal
  [147, 51, 234], //  Indigo
  [192, 38, 211], // Orchid
  [34, 211, 238], // Sky Blue
  [14, 165, 233], // Blue
  [37, 99, 235], // Royal Blue
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
