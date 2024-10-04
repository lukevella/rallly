"use client";
import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";
import React from "react";

const sizeToWidth = {
  xs: 20,
  sm: 24,
  md: 36,
  lg: 48,
  xl: 56,
};

export function OptimizedAvatarImage({
  size,
  className,
  src,
  name,
}: {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  src?: string;
  name: string;
  className?: string;
}) {
  const [isLoaded, setLoaded] = React.useState(false);
  return (
    <Avatar
      className={className}
      style={{ width: sizeToWidth[size], height: sizeToWidth[size] }}
    >
      {src ? (
        src.startsWith("https") ? (
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
        <AvatarFallback
          seed={name}
          className={cn("shrink-0", {
            "text-xs": size === "xs",
            "text-sm": size === "sm",
            "text-md": size === "md",
            "text-lg": size === "lg",
            "text-xl": size === "xl",
          })}
        >
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      ) : null}
    </Avatar>
  );
}
