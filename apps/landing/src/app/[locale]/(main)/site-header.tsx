"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

export function SiteHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  const ref = React.useRef<HTMLElement>(null);
  // null until the scroll position is known, so the header stays opaque over
  // any content behind it before hydration.
  const [stuck, setStuck] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const header = ref.current;
    if (!header) {
      return;
    }
    // The sticky offset is in rem, so re-read it whenever the header resizes:
    // text-only zoom changes it without firing a window resize, but it always
    // resizes the header.
    const readTop = () => Number.parseFloat(getComputedStyle(header).top);
    let stickyTop = readTop();
    const update = () => setStuck(window.scrollY >= -stickyTop);
    update();
    const observer = new ResizeObserver(() => {
      stickyTop = readTop();
      update();
    });
    observer.observe(header);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
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
      data-top={stuck === false || undefined}
      className={cn(
        "sticky -top-4 z-20 border-transparent border-b bg-gray-100 pt-4 transition-[border-color] data-scrolled:border-gray-200 data-top:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}
