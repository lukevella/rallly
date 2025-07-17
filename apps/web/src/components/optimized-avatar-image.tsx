"use client";
import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";
import React from "react";

export function OptimizedAvatarImage({
  size,
  className,
  src,
  name,
}: {
  size: "sm" | "md" | "lg" | "xl";
  src?: string;
  name: string;
  className?: string;
}) {
  const [isLoaded, setLoaded] = React.useState(false);
  return (
    <Avatar className={cn("rounded-full", className)} size={size}>
      {src ? (
        src.startsWith("https") || src.startsWith("data:") ? (
          <AvatarImage src={src} alt={name} />
        ) : (
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
        )
      ) : null}
      {!src || !isLoaded ? (
        <AvatarFallback seed={name} className={cn("shrink-0")}>
          {name?.[0]?.toUpperCase()}
        </AvatarFallback>
      ) : null}
    </Avatar>
  );
}
