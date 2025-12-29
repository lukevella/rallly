import ColorHash from "color-hash";

export const colorHash = new ColorHash({
  hue: [{ min: 220, max: 320 }],
  lightness: [0.65],
  saturation: 0.8,
});

export const generateGradient = (s: string): string => {
  const s1 = s.substring(0, s.length / 2);
  const s2 = s.substring(s.length / 2);
  const c1 = colorHash.hex(s1);
  const c2 = colorHash.hex(s2);

  return `linear-gradient(45deg, ${c1}, ${c2})`;
};
