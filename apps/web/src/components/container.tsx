import { cn } from "@rallly/ui";

export const Container = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={cn("mx-auto max-w-7xl px-3 sm:px-8", className)}>
      {children}
    </div>
  );
};
