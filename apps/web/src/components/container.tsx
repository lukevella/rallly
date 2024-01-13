import { cn } from "@rallly/ui";

export const Container = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={cn("mx-auto max-w-7xl px-4", className)}>{children}</div>
  );
};
