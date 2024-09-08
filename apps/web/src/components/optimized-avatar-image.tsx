"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";

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
      {!src || src.startsWith("https") ? (
        <AvatarImage src={src} alt={name} />
      ) : (
        <Image
          src={`/api/storage/${src}`}
          width={128}
          height={128}
          alt={name}
          style={{ objectFit: "cover" }}
        />
      )}
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
  );
};
