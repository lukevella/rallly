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
    <div className="relative flex h-48 flex-col rounded-lg bg-gray-100 p-4">
      {children}
    </div>
  );
};
