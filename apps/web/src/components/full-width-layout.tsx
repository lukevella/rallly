export function FullWidthLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FullWidthLayoutHeader({
  children,
}: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 rounded-t-lg border-b bg-background/90 px-6 py-4 backdrop-blur-sm">
      {children}
    </header>
  );
}

export function FullWidthLayoutContent({
  children,
}: { children: React.ReactNode }) {
  return <main className="p-6">{children}</main>;
}

export function FullWidthLayoutTitle({
  children,
  icon,
}: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h1 className="font-semibold text-xl">{children}</h1>
    </div>
  );
}
