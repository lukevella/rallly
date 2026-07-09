import { cn } from "@rallly/ui";

export function SettingsPage({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6", className)}
    >
      {children}
    </div>
  );
}

export function SettingsPageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start", className)}>{children}</div>
  );
}

export function SettingsPageTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-semibold text-xl leading-tight tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function SettingsPageDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-1 text-muted-foreground text-sm", className)}>
      {children}
    </p>
  );
}

export function SettingsPageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}
