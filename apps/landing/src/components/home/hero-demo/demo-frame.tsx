import { cn } from "@rallly/ui";

// The window both demo screens sit in: a light border and a soft, layered
// shadow.
export const DemoWindow = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-6px_rgb(0_0_0/0.06),0_24px_64px_-16px_rgb(0_0_0/0.10)]">
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
