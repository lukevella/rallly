import { cn } from "@rallly/ui";

export function SectionGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function Section({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="space-y-2">
      {title ? (
        <h2 className="px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </h2>
      ) : null}
      <div
        className={cn(
          "divide-y divide-gray-950/5 overflow-hidden rounded-2xl bg-gray-100 dark:divide-foreground/5 dark:bg-foreground/5",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex min-h-12 items-center gap-3 px-4 py-2.5", className)}
    >
      {children}
    </div>
  );
}

export function SectionItemLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2.5 font-medium text-foreground text-sm [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionItemValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ml-auto min-w-0 truncate text-right text-muted-foreground text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
