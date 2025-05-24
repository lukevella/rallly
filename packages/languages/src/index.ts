import { languages } from "./languages";

export type SupportedLocale = keyof typeof languages;

export const supportedLngs = Object.keys(languages);

export const defaultLocale = "en";

export default languages;

export { languages };
