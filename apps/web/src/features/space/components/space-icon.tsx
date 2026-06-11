"use client";

import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback } from "@rallly/ui/avatar";
import Image from "next/image";

type SpaceIconProps = {
  name: string;
  className?: string;
  src?: string;
  size: "default" | "sm" | "lg" | "xl";
};

export function SpaceIcon({
  name,
  src,
  className,
  size = "default",
}: SpaceIconProps) {
  return (
    <Avatar
      className={cn("overflow-hidden", className)}
      size={size}
      shape="square"
    >
      {src ? (
        <Image
          src={`/api/storage/${src}`}
          width={128}
          height={128}
          alt={name}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
}
