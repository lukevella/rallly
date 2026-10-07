import { cn } from "@rallly/ui";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";

export function EventMetaTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h1 className={cn("font-semibold text-xl tracking-tight", className)}>
      {children}
    </h1>
  );
}

export function EventMetaList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <ul className={cn(className, "space-y-2")}>{children}</ul>;
}

export function EventMetaItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        className,
        // The icon holds its column and the text wraps beside it rather
        // than under it, so a long location stays legible.
        "flex items-start gap-1.5 text-sm [&>*:not(svg)]:min-w-0 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
      )}
    >
      {children}
    </li>
  );
}

export function EventMetaHost({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(className, "flex items-center gap-2")}>{children}</div>
  );
}

export const EventMetaHostAvatar = OptimizedAvatarImage;

export function EventMetaHostName({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn(className, "text-gray-500 text-sm")}>{children}</p>;
}
