// The accent gradient from the hero event card. The demos' primary actions
// reuse it so the walkthrough reads as the same product surface as the hero,
// rather than a flat indigo that appears nowhere else.
export const ACCENT = "bg-linear-to-r from-indigo-500 to-violet-500";

// The same gradient at the weight a hairline carries, for edges that used to
// be a flat indigo-200. Gradients cannot live in border-color, so this is
// applied as a padded backdrop behind the surface rather than as a border.
export const ACCENT_EDGE = "bg-linear-to-r from-indigo-500/30 to-violet-500/30";
