import { cn } from "@rallly/ui";
import { MarkdownDescription } from "@rallly/ui/markdown-description";
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

export function EventMetaDescription({
  className,
  content,
}: {
  className?: string;
  content?: string | null;
}) {
  if (!content) {
    return null;
  }
  return (
    <MarkdownDescription
      content={content}
      className={cn(className, "min-w-0 opacity-90")}
    />
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
        "flex flex-wrap items-center gap-1.5 text-sm [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
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
