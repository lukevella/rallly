export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 py-6">
      <div className="w-full">
        <div className="mx-auto max-w-2xl space-y-12">{children}</div>
      </div>
    </div>
  );
}
