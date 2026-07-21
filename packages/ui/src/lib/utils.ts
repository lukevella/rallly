import type { ClassValue } from "clsx";
import clsx from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge v1 predates the text-wrap utilities and misclassifies them
// as text colors, so `cn("text-pretty text-muted-foreground")` would drop
// `text-pretty`. Remove this once tailwind-merge is upgraded to v2+.
const twMerge = extendTailwindMerge({
  classGroups: {
    "text-wrap": [{ text: ["wrap", "nowrap", "balance", "pretty"] }],
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
