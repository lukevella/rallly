"use client";

import * as React from "react";
import type { Orientation, SpawnArea } from "@/components/home/grid-animation";
import { GridAnimation } from "@/components/home/grid-animation";

// The mask clears an ellipse behind the header's Login and Create a poll
// buttons, positioned from the rendered buttons so it follows the mobile menu
// and longer translations. Until measured, it falls back to the desktop layout.
const actionsFallbackX =
  "calc(100% - max((100vw - 72rem) / 2, 0px) - 24px - 93px)";

function useHeaderActionsHole(
  frameRef: React.RefObject<HTMLDivElement | null>,
) {
  React.useEffect(() => {
    const frame = frameRef.current;
    const actions = document.querySelector<HTMLElement>(
      "[data-header-actions]",
    );
    const header = actions?.closest("header");
    if (!frame || !actions || !header) {
      return;
    }
    const measure = () => {
      const frameRect = frame.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      // The header is in flow at the page top, so its offset from the
      // actions holds whether or not it is currently stuck.
      const headerRect = header.getBoundingClientRect();
      frame.style.setProperty(
        "--actions-x",
        `${actionsRect.left + actionsRect.width / 2 - frameRect.left}px`,
      );
      frame.style.setProperty(
        "--actions-y",
        `${actionsRect.top - headerRect.top + actionsRect.height / 2}px`,
      );
      frame.style.setProperty(
        "--actions-rx",
        `${actionsRect.width / 2 + 77}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(actions);
    observer.observe(frame);
    // At wide viewports neither element changes size while the container
    // recentres, so also remeasure on viewport resize.
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [frameRef]);
}

// Keeps crossings in the top-right band the mask leaves visible.
const heroSpawnArea: SpawnArea = { minX: 0.3, maxX: 1, minY: 0.12, maxY: 0.62 };

export function HeroBackdrop({
  orientation = "diagonal",
}: {
  orientation?: Orientation;
}) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  useHeaderActionsHole(frameRef);

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-[calc(-1*(var(--site-header-height,61px)+1rem))] right-[calc(50%-50vw)] -z-10 hidden h-[680px] w-[min(1000px,75vw)] md:block"
      style={{
        maskImage: [
          "linear-gradient(220deg, black 35%, transparent 72%)",
          // Fade out at the viewport's right edge and the page's top edge.
          "linear-gradient(to left, transparent, black 140px)",
          "linear-gradient(to bottom, transparent, black 117px)",
          // Clear the area behind the header's Login and Create a poll buttons.
          `radial-gradient(ellipse var(--actions-rx, 170px) 60px at var(--actions-x, ${actionsFallbackX}) var(--actions-y, 46px), transparent 45%, black 100%)`,
        ].join(", "),
        maskComposite: "intersect",
      }}
    >
      <GridAnimation orientation={orientation} spawnArea={heroSpawnArea} />
    </div>
  );
}
