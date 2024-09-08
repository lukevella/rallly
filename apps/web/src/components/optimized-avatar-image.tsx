"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";

function getAvatarUrl(imageKey: string) {
  // Some users have avatars that come from external providers (e.g. Google).
  if (imageKey.startsWith("https://")) {
    return imageKey;
  }

  return `/api/storage/${imageKey}`;
}

export const OptimizedAvatarImage = ({
  size,
  className,
  src,
  name,
}: {
  size: number;
  src?: string;
  name: string;
  className?: string;
}) => {
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {src ? (
        src.startsWith("http") ? (
          <AvatarImage src={src} alt={name} />
        ) : (
          <Image
            src={getAvatarUrl(src)}
            width={128}
            height={128}
            alt={name}
            style={{ objectFit: "cover" }}
            objectFit="cover"
          />
        )
      ) : (
        <AvatarFallback>{name[0]}</AvatarFallback>
      )}
    </Avatar>
  );
};
