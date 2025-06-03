import { Logo } from "@/components/logo";

export function AuthPageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="mb-12">
        <Logo className="mx-auto" />
      </div>
      {children}
    </div>
  );
}

export function AuthPageHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1 text-center">{children}</div>;
}

export function AuthPageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-bold text-2xl">{children}</h1>;
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
    <p className="px-4 py-3 text-center text-muted-foreground">{children}</p>
  );
}
