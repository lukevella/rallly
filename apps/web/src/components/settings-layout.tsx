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
    <div
      className={cn(
        "grid auto-rows-min items-start gap-x-4 gap-y-1 has-data-[slot=settings-page-action]:grid-cols-1 has-data-[slot=settings-page-action]:sm:grid-cols-[1fr_auto]",
        className,
      )}
    >
      {children}
    </div>
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
    <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
  );
}

export function SettingsPageAction({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="settings-page-action"
      className={cn(
        "mt-3 flex shrink-0 items-center gap-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:self-center sm:justify-self-end",
        className,
      )}
    >
      {children}
    </div>
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
