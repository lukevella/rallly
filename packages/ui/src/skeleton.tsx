import { cn } from "./lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-foreground/10 dark:bg-foreground/15",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
