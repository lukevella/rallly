// Shared motion vocabulary for the how it works demos, so the three steps
// move with one cadence instead of each inventing its own.

// Strong ease-out. The built-in curves are too soft to read as deliberate at
// these short durations.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Stagger between sibling beats: one date, one participant's votes. Kept
// short so a four beat sequence still resolves in well under a second.
export const STAGGER = 0.06;

// Leaving is not a performance: everything drops back at once, faster than it
// arrived, so moving the pointer away feels like an undo rather than a rewind.
export const EXIT = { duration: 0.18, ease: EASE_OUT } as const;

// A press is two beats, not one curve: the dip is a quick duration ease, the
// release settles on a spring so the button rebounds instead of interpolating
// back. Motion only supports two keyframes on a spring, so these are applied
// as separate transitions rather than one keyframe array.
export const PRESS_DOWN = { duration: 0.09, ease: EASE_OUT } as const;
export const PRESS_UP = {
  type: "spring",
  duration: 0.44,
  bounce: 0.42,
} as const;
