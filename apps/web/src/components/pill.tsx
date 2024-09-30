export function PillList({ children }: React.PropsWithChildren) {
  return <ul className="flex flex-wrap gap-1">{children}</ul>;
}

export function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md border bg-gray-50 px-1.5 py-0.5 text-sm">
      {children}
    </span>
  );
}
