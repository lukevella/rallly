"use client";

import { cn } from "@rallly/ui";
import type { AvatarProps } from "@rallly/ui/avatar";
import { Avatar, AvatarFallback } from "@rallly/ui/avatar";

type SpaceIconProps = {
  name: string;
  className?: string;
} & AvatarProps;

export function SpaceIcon({ name, className, size }: SpaceIconProps) {
  return (
    <Avatar className={cn(className)} size={size}>
      <AvatarFallback seed={name}>{name[0]}</AvatarFallback>
    </Avatar>
  );
}
