import { cn } from "@rallly/ui";

export function GridCardFooter({ children }: React.PropsWithChildren) {
  return <div className="relative z-10 mt-6">{children}</div>;
}

export function GridCardHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export const GridCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative rounded-lg border bg-white p-4 shadow-sm">
      {children}
    </div>
  );
};
