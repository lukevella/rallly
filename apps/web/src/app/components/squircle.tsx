import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";

export function Squircle({
  children,
  asChild,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
  style?: React.CSSProperties;
}) {
  const Comp = asChild ? Slot : "div";
  return (
    <>
      <Comp
        className={cn("relative", className)}
        style={{
          clipPath: `url(#squircleClip)`,
          ...style,
        }}
      >
        {children}
      </Comp>
    </>
  );
}

export function SquircleClipPath() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      className="pointer-events-none absolute"
    >
      <defs>
        <clipPath id="squircleClip" clipPathUnits="objectBoundingBox">
          <path d="M 0,0.5 C 0,0 0,0 0.5,0 S 1,0 1,0.5 1,1 0.5,1 0,1 0,0.5" />
        </clipPath>
      </defs>
    </svg>
  );
}
