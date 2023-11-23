export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full p-3 sm:p-8">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
