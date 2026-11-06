"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

/**
 * Sticks to the top of the page once its top padding has scrolled away, as
 * the landing page header does, and shows its border only while stuck.
 * Stuck is read from the header's own position rather than the scroll
 * offset, so anything above it (the manager notice) is accounted for.
 */
export function InviteHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  const ref = React.useRef<HTMLElement>(null);
  const [stuck, setStuck] = React.useState(false);

  React.useEffect(() => {
    const header = ref.current;
    if (!header) {
      return;
    }
    const stickyTop = Number.parseFloat(getComputedStyle(header).top);
    const update = () =>
      setStuck(header.getBoundingClientRect().top <= stickyTop);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled={stuck || undefined}
      className={cn(
        "group/header sticky -top-4 z-40 border-transparent border-b bg-gray-100 pt-4 transition-colors data-scrolled:border-border dark:bg-gray-900",
        className,
      )}
      {...props}
    />
  );
}
