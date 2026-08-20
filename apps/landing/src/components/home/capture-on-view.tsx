"use client";

import { posthog } from "@rallly/posthog/client";
import * as React from "react";

/**
 * Fires a PostHog event the first time its contents scroll into view.
 *
 * Uses a partial threshold rather than requiring the whole block to be visible:
 * a full-visibility threshold silently never fires when the block is taller
 * than the viewport, which would drop the event on small screens.
 */
export function CaptureOnView({
  event,
  children,
}: {
  event: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        observer.disconnect();
        posthog.capture(event);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [event]);

  return <div ref={ref}>{children}</div>;
}
