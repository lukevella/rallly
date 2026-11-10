import { cn } from "@rallly/ui";

// Decorative dot grid filling the footer's spare column. Purely textural, so
// it is aria-hidden and the copy alongside it carries the meaning.
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
          // Dots rather than ruled lines: far less ink for the same rhythm.
          "bg-[radial-gradient(--theme(--color-black/12%)_1px,transparent_1px)]",
          "bg-[size:24px_24px]",
          // Fades out on every edge, so the pattern approaches the footer's
          // top border without ever meeting it.
          "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent),linear-gradient(to_bottom,transparent,black_18%,black_75%,transparent)]",
          "[mask-composite:intersect]",
        )}
      />
    </div>
  );
}
