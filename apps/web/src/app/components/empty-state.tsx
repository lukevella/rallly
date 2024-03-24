import { IconComponent } from "@/types";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconComponent;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 p-8 lg:p-16">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-lg p-8 text-center">
        {Icon ? (
          <div className="mb-4 inline-flex rounded-md bg-gray-400 p-3 text-gray-200">
            <Icon className="size-6" />
          </div>
        ) : null}
        {title ? <p className="mb-1 text-sm font-semibold">{title}</p> : null}
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}
