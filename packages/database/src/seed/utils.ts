/**
 * Generates a random integer between floor and max (inclusive).
 * @param max The maximum value.
 * @param floor The minimum value (default: 0).
 * @returns A random integer.
 */
export const randInt = (max = 1, floor = 0): number => {
  return Math.round(Math.random() * max) + floor;
};
