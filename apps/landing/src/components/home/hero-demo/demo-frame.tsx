import { cn } from "@rallly/ui";

// The shared device bezel: glass frame, identical corner treatment for the
// desktop and phone shots, differing only in size.
export const DemoFrame = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-[2.2rem] border border-white/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl",
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
    className={cn(
      "overflow-hidden rounded-[1.8rem] border bg-white",
      className,
    )}
  >
    {children}
  </div>
);
