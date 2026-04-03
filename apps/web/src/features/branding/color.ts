import { adjustColorForContrast, getForegroundColor } from "@/utils/color";
import { DARK_MODE_BACKGROUND, LIGHT_MODE_BACKGROUND } from "./constants";

export function getPrimaryColorVars(primaryColor: string) {
  const light = adjustColorForContrast(primaryColor, LIGHT_MODE_BACKGROUND);
  const dark = adjustColorForContrast(primaryColor, DARK_MODE_BACKGROUND);
  return {
    light,
    lightForeground: getForegroundColor(light),
    dark,
    darkForeground: getForegroundColor(dark),
  };
}
