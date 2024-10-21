import Image from "next/image";

export function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <Image
        src="/images/logo-mark.svg"
        alt="Rallly"
        width={32}
        height={32}
        priority={true}
      />
      {children}
    </div>
  );
}

export function LoginCardHeader({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-0.5">{children}</div>;
}

export function LoginCardTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-lg font-bold tracking-tight">{children}</h1>;
}

export function LoginCardDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
