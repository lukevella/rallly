import { createCn } from "cn/config";

/**
 * Registers the radius tokens from `@theme` in tailwind-config/shared-styles.css
 * so a caller's `rounded-*` replaces a component's `rounded-control*` instead of
 * leaving both for CSS order to decide.
 */
export const cn = createCn({
  extend: {
    theme: {
      radius: [
        "control-xs",
        "control-sm",
        "control",
        "control-lg",
        "popup",
        "dock",
      ],
    },
  },
});
