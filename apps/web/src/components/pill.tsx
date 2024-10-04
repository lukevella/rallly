export function PillList({ children }: React.PropsWithChildren) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}

export function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md text-sm">
      {children}
    </span>
  );
}
