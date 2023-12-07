import { cn } from "@rallly/ui";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function PageTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-semibold leading-9", className)}>{children}</h2>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("", className)}>{children}</div>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6", className)}>{children}</div>;
}
