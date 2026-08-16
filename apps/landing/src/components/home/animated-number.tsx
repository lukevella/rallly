"use client";

import NumberFlow from "@number-flow/react";
import * as React from "react";

export function AnimatedNumber({
  value,
  locale,
}: {
  value: number;
  locale: string;
}) {
  const [shown, setShown] = React.useState(value);
  const [animated, setAnimated] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        observer.disconnect();
        // Two committed renders: drop to 0 without animation, then roll up.
        setShown(0);
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            setAnimated(true);
            setShown(value);
          });
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref}>
      <NumberFlow
        value={shown}
        locales={locale}
        animated={animated}
        spinTiming={{ duration: 1200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </span>
  );
}
