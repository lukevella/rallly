"use client";
import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import React from "react";
import { resolveStorageUrl } from "@/utils/storage";

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
  return `https://0.gravatar.com/avatar/${hashHex}?d=404&s=128&r=g`;
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
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .replace(/[^\p{L}]/gu, "")
    .toUpperCase();

  const imageSrc = src || gravatarUrl;

  return (
    <Avatar className={cn("rounded-full", className)} size={size}>
      {imageSrc ? (
        <AvatarImage src={resolveStorageUrl(imageSrc)} alt={name} />
      ) : null}
      <AvatarFallback seed={name} className={cn("shrink-0")}>
        {/^\p{L}+$/u.test(initials) ? (
          initials
        ) : (
          <Icon>
            <UserIcon />
          </Icon>
        )}
      </AvatarFallback>
    </Avatar>
  );
}
