"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

// Matches the sticky header offset (`scroll-mt-24`) with a little slack, so a
// heading that has just been scrolled to by hash counts as the current one.
const ACTIVE_OFFSET = 100;

export function LegalPageIndex({
  items,
}: {
  items: { id: string; title: string }[];
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const atBottom =
        window.innerHeight + window.scrollY >= doc.scrollHeight - 1;
      let current: HTMLElement | null = null;
      if (atBottom) {
        current = headings[headings.length - 1] ?? null;
      } else {
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= ACTIVE_OFFSET) {
            current = heading;
          }
        }
      }
      setActiveId(current?.id ?? null);
    };

    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav aria-labelledby="legal-page-index-label">
      <p id="legal-page-index-label" className="text-gray-500 text-sm">
        Contents
      </p>
      <ul className="mt-2 border-gray-200 border-l">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1 pl-3 text-sm transition-colors",
                  isActive
                    ? "border-gray-800 text-gray-800"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
