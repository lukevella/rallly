import { cn } from "@rallly/ui";

// The shared device bezel: glass frame, identical corner treatment for the
// desktop and phone shots, differing only in size. The screen radius is the
// frame radius minus the 1px border and 6px padding so the corners stay
// concentric.
export const DemoFrame = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-3xl border border-white/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl",
      className,
    )}
  >
    {children}
  </div>
);

export const DemoScreen = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn("overflow-hidden rounded-[17px] border bg-white", className)}
  >
    {children}
  </div>
);
