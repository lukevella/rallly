export function PillList({ children }: React.PropsWithChildren) {
  return <ul className="flex gap-2">{children}</ul>;
}

export function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md border bg-gray-50 p-1 text-sm">
      {children}
    </span>
  );
}
