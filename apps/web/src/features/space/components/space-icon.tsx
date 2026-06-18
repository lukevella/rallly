"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { resolveStorageUrl } from "@/utils/storage";

type SpaceIconProps = {
  name: string;
  className?: string;
  src?: string;
  size?: "default" | "sm" | "lg" | "xl";
};

export function SpaceIcon({
  name,
  src,
  className,
  size = "default",
}: SpaceIconProps) {
  return (
    <Avatar className={className} size={size} shape="square" bordered={!src}>
      {src ? <AvatarImage src={resolveStorageUrl(src)} alt={name} /> : null}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
