"use client";

import * as m from "motion/react-m";
import * as React from "react";
import { EXIT, PRESS_DOWN, PRESS_UP } from "./motion";

// The primary button in a demo, pressed on cue. The dip and the release are
// separate beats so the button rebounds off a spring instead of interpolating
// symmetrically back, which is what makes a press read as a press.
export const PressButton = ({
  play,
  delay,
  className,
}: {
  play: boolean;
  delay: number;
  className?: string;
}) => {
  const [down, setDown] = React.useState(false);

  React.useEffect(() => {
    if (!play) {
      setDown(false);
      return;
    }
    const press = setTimeout(() => setDown(true), delay * 1000);
    const release = setTimeout(
      () => setDown(false),
      delay * 1000 + PRESS_DOWN.duration * 1000 + 60,
    );
    return () => {
      clearTimeout(press);
      clearTimeout(release);
    };
  }, [play, delay]);

  return (
    <m.div
      className={className}
      initial={false}
      animate={{ scale: down ? 0.93 : 1 }}
      transition={play ? (down ? PRESS_DOWN : PRESS_UP) : EXIT}
    />
  );
};
