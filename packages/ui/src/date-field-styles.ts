import { cn } from "./lib/utils";

/**
 * Shared styling for react-aria segmented date/time fields.
 *
 * Height and radius match the default Button and Input (h-9, rounded-lg) so a
 * date or time field lines up with the rest of the form controls. react-aria
 * exposes focus/invalid/disabled as data attributes on the wrapper rather than
 * through `has-[]` selectors, so the states are re-expressed here.
 */
export const fieldGroupClassName = cn(
  "flex h-9 w-full min-w-0 items-center rounded-lg border border-input bg-background/80 py-1 pr-1 pl-2 text-sm outline-none transition-colors dark:bg-input/30",
  "data-[focus-within]:border-ring data-[focus-within]:ring-3 data-[focus-within]:ring-ring/50",
  "data-[invalid]:border-destructive data-[invalid]:ring-3 data-[invalid]:ring-destructive/20 dark:data-[invalid]:ring-destructive/40",
  "data-[disabled]:opacity-50",
);

/**
 * react-aria wraps the value in Unicode bidi isolates (U+2066/U+2069), emitted
 * as their own `literal` segments. They render invisibly but would still take
 * horizontal padding, pushing the first digit past the field's inset — so they
 * get no padding of their own.
 */
export const isBidiIsolate = (text: string) => /^[⁦-⁩]+$/.test(text);

/** Each segment keeps its own inset, hence the group's tighter pl-2. */
export const segmentClassName = cn(
  "rounded-sm px-0.5 outline-none",
  // Separators are structure, not content — mute them so the values lead.
  "data-[type=literal]:text-muted-foreground",
  // accent is a translucent overlay, so the text stays `foreground` — the
  // near-white primary-foreground would be unreadable on it.
  "focus:bg-accent focus:text-foreground",
  "data-[placeholder]:text-muted-foreground",
  "data-[disabled]:opacity-50",
);

/** Matches the Button `icon-sm` footprint, sized for the h-9 field. */
export const triggerButtonClassName = cn(
  "ml-auto inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors",
  "hover:bg-accent hover:text-foreground",
  "data-[focus-visible]:ring-3 data-[focus-visible]:ring-ring/50",
);
