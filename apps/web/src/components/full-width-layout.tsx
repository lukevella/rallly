export function FullWidthLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FullWidthLayoutHeader({
  children,
}: { children: React.ReactNode }) {
  return (
    <header className="py-4 rounded-t-lg bg-background/90 backdrop-blur-sm sticky top-0 z-10 px-6 border-b">
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
      <h1 className="text-xl font-semibold">{children}</h1>
    </div>
  );
}
