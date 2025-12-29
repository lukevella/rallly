"use client";
import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";
import React from "react";

async function getGravatarUrl(email: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `https://0.gravatar.com/avatar/${hashHex}?d=404&s=128`;
}

export function OptimizedAvatarImage({
  size = "md",
  className,
  src,
  name,
  email,
}: {
  size: "sm" | "md" | "lg" | "xl";
  src?: string;
  name: string;
  className?: string;
  email?: string;
}) {
  const [isLoaded, setLoaded] = React.useState(false);
  const [gravatarUrl, setGravatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!src && email) {
      getGravatarUrl(email)
        .then(setGravatarUrl)
        .catch(() => {
          setGravatarUrl(null);
        });
    }
  }, [src, email]);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  const imageSrc = src || gravatarUrl;

  return (
    <Avatar className={cn("rounded-full", className)} size={size}>
      {imageSrc ? (
        imageSrc.startsWith("https") || imageSrc.startsWith("data:") ? (
          <AvatarImage src={imageSrc} alt={name} />
        ) : (
          <Image
            src={`/api/storage/${imageSrc}`}
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
      {!imageSrc || !isLoaded ? (
        <AvatarFallback seed={name} className={cn("shrink-0")}>
          {initials}
        </AvatarFallback>
      ) : null}
    </Avatar>
  );
}
