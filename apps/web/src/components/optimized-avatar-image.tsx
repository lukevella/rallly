"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";

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
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {!src || src.startsWith("https") ? (
        <AvatarImage src={src} alt={name} />
      ) : isAvatarsEnabled ? (
        <Image
          src={`/api/storage/${src}`}
          width={128}
          height={128}
          alt={name}
          style={{ objectFit: "cover" }}
        />
      ) : null}
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
  );
}
