"use client";

import { cn } from "@rallly/ui";
import React from "react";

/**
 * Eases between content heights instead of snapping, for containers whose
 * content swaps or grows (an empty state giving way to a list). Height is the
 * one property with no transform equivalent here. The first measurement sets
 * the height without a transition: browsers do not animate from `auto`.
 */
export function AnimatedHeight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number>();

  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "overflow-y-clip transition-[height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        className,
      )}
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
