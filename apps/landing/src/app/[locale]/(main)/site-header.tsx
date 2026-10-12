"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

export function SiteHeader({
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
    const update = () => setStuck(window.scrollY >= -stickyTop);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  React.useEffect(() => {
    const header = ref.current;
    if (!header) {
      return;
    }
    const root = document.documentElement;
    // The sticky offset hides the top of the header, so publish only the
    // height that stays visible once it sticks.
    const observer = new ResizeObserver(() => {
      const stickyTop = Number.parseFloat(getComputedStyle(header).top);
      root.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height + stickyTop}px`,
      );
    });
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--site-header-height");
    };
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled={stuck || undefined}
      className={cn(
        "sticky -top-4 z-20 border-transparent border-b bg-gray-100 pt-4 transition-colors data-scrolled:border-gray-200",
        className,
      )}
      {...props}
    />
  );
}
