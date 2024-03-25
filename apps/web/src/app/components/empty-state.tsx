import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-lg p-8 text-center">
        {icon ? (
          <div className="mb-4 inline-flex rounded-full border p-4">
            <Icon size="lg">{icon}</Icon>
          </div>
        ) : null}
        {title ? <p className="mb-1 text-base font-semibold">{title}</p> : null}
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </div>
  );
}
