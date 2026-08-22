"use client";

import { posthog } from "@rallly/posthog/client";
import type { ReactNode } from "react";
import * as React from "react";

/**
 * Fires a PostHog event the first time its contents scroll into view.
 *
 * Deliberately not a ratio threshold: a block taller than twice the viewport
 * can never reach a 0.5 ratio, and one taller than the viewport can never
 * reach 1, so either would silently stop reporting on small screens. Insetting
 * the root bottom edge instead means "scrolled meaningfully into view" holds
 * at any element height.
 */
export function CaptureOnView({
  event,
  children,
}: {
  event: string;
  children: ReactNode;
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
      { rootMargin: "0px 0px -150px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [event]);

  return <div ref={ref}>{children}</div>;
}
