import { cn } from "@rallly/ui";
import { Card } from "@rallly/ui/card";

export function LoginCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-xl", className)}>
      <div className="space-y-8 px-8 py-7">{children}</div>
    </Card>
  );
}

export function LoginCardHeader({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
}

export function LoginCardContent({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
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
