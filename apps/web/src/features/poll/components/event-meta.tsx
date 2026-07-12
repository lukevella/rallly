import { cn } from "@rallly/ui";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";

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
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        className,
        "min-w-0 whitespace-pre-wrap text-pretty text-foreground text-sm leading-relaxed opacity-90",
      )}
    >
      <TruncatedLinkify>{children}</TruncatedLinkify>
    </p>
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
