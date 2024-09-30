import { cn } from "@rallly/ui";

export function GridCardFooter({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("relative z-10 mt-4", className)}>{children}</div>;
}

export function GridCardHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export const GridCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative rounded-lg border bg-white p-3 shadow-sm">
      {children}
    </div>
  );
};
