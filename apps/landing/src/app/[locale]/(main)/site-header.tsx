"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

export function SiteHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  const ref = React.useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
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
    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`,
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
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-20 border-transparent border-b bg-gray-100 transition-colors data-scrolled:border-gray-200",
        className,
      )}
      {...props}
    />
  );
}
