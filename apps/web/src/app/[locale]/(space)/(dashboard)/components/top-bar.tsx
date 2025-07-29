import { cn } from "@rallly/ui";

export function TopBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center gap-4 rounded-t-lg border-b bg-background/90 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TopBarLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center gap-x-4">{children}</div>;
}

export function TopBarRight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-end gap-x-4">
      {children}
    </div>
  );
}

export function TopBarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-x-1", className)}>{children}</div>
  );
}

export function TopBarSeparator() {
  return <div className="h-4 w-px bg-border" />;
}
