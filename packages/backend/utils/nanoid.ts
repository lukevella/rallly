import { customAlphabet } from "nanoid/async";

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export const randomid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12,
);

export const generateOtp = customAlphabet("0123456789", 6);
