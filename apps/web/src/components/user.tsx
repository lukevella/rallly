"use client";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { User2Icon } from "lucide-react";

import { getRandomAvatarColor } from "@/utils/color-hash";

interface UserAvatarProps {
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const UserAvatar = ({
  size = "md",
  name,
  className,
}: UserAvatarProps) => {
  const colors = name ? getRandomAvatarColor(name) : null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        {
          "size-5 text-[10px]": size === "xs",
          "size-6 text-sm": size === "sm",
          "size-8 text-base": size === "md",
          "size-10 text-lg": size === "lg",
        },
        !name
          ? "bg-gray-200"
          : colors?.requiresDarkText
            ? "text-gray-800"
            : "text-white",
        className,
      )}
      style={{
        backgroundColor: colors?.color,
      }}
    >
      {name ? (
        name[0].toUpperCase()
      ) : (
        <Icon>
          <User2Icon />
        </Icon>
      )}
    </span>
  );
};
