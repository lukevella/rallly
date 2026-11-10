import { cn } from "@rallly/ui";
import type { SpawnArea } from "@/components/home/grid-animation";
import { GridAnimation } from "@/components/home/grid-animation";

// Keeps crossings inside the part of the slot the mask leaves visible.
const footerSpawnArea: SpawnArea = {
  minX: 0.2,
  maxX: 0.8,
  minY: 0.25,
  maxY: 0.7,
};

// The hero's animated grid, filling the footer's spare column. Purely
// textural, so it is aria-hidden and the copy alongside it carries the meaning.
export function FooterPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative isolate", className)}>
      {/* Dissolves well before the edges so the pattern has no hard border
          and reads as texture rather than a box. */}
      <div
        className={cn(
          // Fills the slot's full width and bleeds up into the footer's top
          // padding, where the mask fades it out just shy of the border. No
          // sideways bleed: that would widen the page.
          "absolute -top-14 right-0 -bottom-10 left-0 -z-10",
          // Fades out on every edge, so the grid approaches the footer's top
          // border without ever meeting it.
          "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent),linear-gradient(to_bottom,transparent,black_18%,black_75%,transparent)]",
          "[mask-composite:intersect]",
        )}
      >
        <GridAnimation orientation="grid" spawnArea={footerSpawnArea} />
      </div>
    </div>
  );
}
