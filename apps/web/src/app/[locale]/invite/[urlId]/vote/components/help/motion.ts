// Motion vocabulary for the help page demos, matching the cadence of the
// how it works walkthrough on the landing page.

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Leaving is an undo, not a rewind: everything drops back at once.
export const EXIT = { duration: 0.18, ease: EASE_OUT } as const;

export const PRESS_DOWN = { duration: 0.09, ease: EASE_OUT } as const;
export const PRESS_UP = {
  type: "spring",
  duration: 0.44,
  bounce: 0.42,
} as const;

export const POP = { type: "spring", duration: 0.44, bounce: 0.42 } as const;

// "idle" is the resting state, "play" runs the timed sequence, and "done"
// jumps to the finished frame with no movement, for reduced motion.
export type Playback = "idle" | "play" | "done";
