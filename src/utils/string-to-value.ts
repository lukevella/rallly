export const stringToValue = (seed: string): number => {
  let num = 0;
  for (let i = 0; i < seed.length; i++) {
    num += seed.charCodeAt(i);
  }
  return num;
};
