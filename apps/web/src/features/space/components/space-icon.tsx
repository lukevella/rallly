"use client";

import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback } from "@rallly/ui/avatar";
import Image from "next/image";
import * as React from "react";
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
  const [erroredSrc, setErroredSrc] = React.useState<string | null>(null);
  const hasError = src !== undefined && erroredSrc === src;
  const hasImage = Boolean(src) && !hasError;

  return (
    <Avatar
      className={cn("overflow-hidden", className)}
      size={size}
      shape="square"
      bordered={!hasImage}
    >
      {src && !hasError ? (
        <Image
          src={resolveStorageUrl(src)}
          width={128}
          height={128}
          alt={name}
          style={{ objectFit: "cover" }}
          onError={() => {
            setErroredSrc(src);
          }}
        />
      ) : (
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
}
