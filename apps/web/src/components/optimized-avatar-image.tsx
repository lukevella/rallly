import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { UserIcon } from "lucide-react";
import { resolveStorageUrl } from "@/lib/storage/resolve-storage-url";

export function OptimizedAvatarImage({
  size = "md",
  className,
  src,
  name,
}: {
  size: "sm" | "md" | "lg" | "xl";
  src?: string;
  name: string;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .replace(/[^\p{L}]/gu, "")
    .toUpperCase();

  const hasInitials = /^\p{L}+$/u.test(initials);

  return (
    <Avatar
      className={className}
      size={size === "md" ? "default" : size}
      bordered={!!src || !hasInitials}
    >
      <AvatarImage src={src ? resolveStorageUrl(src) : undefined} alt={name} />
      <AvatarFallback
        className={cn("shrink-0")}
        seed={hasInitials ? name.trim() : undefined}
      >
        {hasInitials ? (
          initials
        ) : (
          <UserIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
