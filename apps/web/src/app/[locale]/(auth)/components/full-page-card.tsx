export function FullPageCardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col gap-6 bg-gray-50 p-4">
      <div className="rounded-xl border bg-white p-4">{children}</div>
    </div>
  );
}

export function FullPageCardHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <header>{children}</header>;
}

export function FullPageCardTitle({ children }: { children: React.ReactNode }) {
  return <h1>{children}</h1>;
}

export function FullPageCardDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p>{children}</p>;
}

export function FullPageCardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1">{children}</main>;
}

export function FullPageCardFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <footer>{children}</footer>;
}
