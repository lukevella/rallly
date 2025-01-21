export function AuthPageContainer({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 lg:space-y-10">{children}</div>;
}

export function AuthPageHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1 text-center">{children}</div>;
}

export function AuthPageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold">{children}</h1>;
}

export function AuthPageDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function AuthPageContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function AuthPageExternal({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground px-4 py-3 text-center">{children}</p>
  );
}
