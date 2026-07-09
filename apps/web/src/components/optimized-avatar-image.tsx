import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { Icon } from "@rallly/ui/icon";
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

  return (
    <Avatar className={className} size={size === "md" ? "default" : size}>
      <AvatarImage src={src ? resolveStorageUrl(src) : undefined} alt={name} />
      <AvatarFallback className={cn("shrink-0")}>
        {/^\p{L}+$/u.test(initials) ? (
          initials
        ) : (
          <Icon>
            <UserIcon />
          </Icon>
        )}
      </AvatarFallback>
    </Avatar>
  );
}
