export const requiredString = (value: string) => !!value.trim();

export const validEmail = (value: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
