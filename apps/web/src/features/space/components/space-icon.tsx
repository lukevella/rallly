"use client";

import { cn } from "@rallly/ui";
import type { AvatarProps } from "@rallly/ui/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { resolveStorageUrl } from "@/utils/storage";

type SpaceIconProps = {
  name: string;
  className?: string;
  src?: string;
} & AvatarProps;

export function SpaceIcon({ name, src, className, size }: SpaceIconProps) {
  return (
    <Avatar className={cn(className)} size={size}>
      {src ? <AvatarImage src={resolveStorageUrl(src)} alt={name} /> : null}
      <AvatarFallback seed={name}>
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
