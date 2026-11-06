// Each answer sits on a tile tinted with its own colour and edged with a
// faint ring of the same hue, so a row reads at a glance. In dark mode a
// darkened tint turns yellow brown and green olive, so dark uses lighter
// shades at low opacity, keeping the three tiles at a similar lightness.
export const voteTint: Record<"yes" | "ifNeedBe" | "no", string> = {
  yes: "bg-green-500/15 ring-1 ring-green-500/25 ring-inset dark:bg-green-400/10 dark:ring-green-400/20",
  ifNeedBe:
    "bg-amber-400/20 ring-1 ring-amber-400/40 ring-inset dark:bg-amber-300/10 dark:ring-amber-300/20",
  no: "bg-gray-500/10 ring-1 ring-gray-500/15 ring-inset dark:bg-white/4 dark:ring-white/8",
};

// The vote selector's hover and press: a step stronger than its tint, so the
// cell responds in its own colour. The press matters as much as the hover:
// every click cycles the answer, and the button's default press is gray.
export const voteTintHover: Record<"yes" | "ifNeedBe" | "no", string> = {
  yes: "hover:bg-green-500/25 active:bg-green-500/30 dark:hover:bg-green-400/15 dark:active:bg-green-400/20",
  ifNeedBe:
    "hover:bg-amber-400/30 active:bg-amber-400/35 dark:hover:bg-amber-300/15 dark:active:bg-amber-300/20",
  no: "hover:bg-gray-500/15 active:bg-gray-500/20 dark:hover:bg-white/8 dark:active:bg-white/12",
};
