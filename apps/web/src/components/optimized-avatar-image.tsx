"use client";
import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";
import React from "react";

import { useAvatarsEnabled } from "@/features/avatars";

export function OptimizedAvatarImage({
  size,
  className,
  src,
  name,
}: {
  size: number;
  src?: string;
  name: string;
  className?: string;
}) {
  const isAvatarsEnabled = useAvatarsEnabled();
  const [isLoaded, setLoaded] = React.useState(false);
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {src ? (
        src.startsWith("https") ? (
          <AvatarImage src={src} alt={name} />
        ) : isAvatarsEnabled ? (
          <Image
            src={`/api/storage/${src}`}
            width={128}
            height={128}
            alt={name}
            style={{ objectFit: "cover" }}
            onLoad={() => {
              setLoaded(true);
            }}
          />
        ) : null
      ) : null}
      {!src || !isLoaded ? (
        <AvatarFallback
          seed={name}
          className={cn({
            "text-xs": size <= 24,
            "text-lg": size >= 48,
          })}
        >
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      ) : null}
    </Avatar>
  );
}
