export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border p-6 lg:flex-row">
      {children}
    </div>
  );
}

export function SettingsGroupHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="lg:w-1/3">{children}</div>;
}

export function SettingsGroupTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h2 className="font-semibold text-base">{children}</h2>;
}

export function SettingsGroupDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="mt-1 text-muted-foreground text-sm">{children}</p>;
}

export function SettingsGroupContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1">{children}</div>;
}
