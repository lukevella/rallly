"use client";
import clsx from "clsx";
import { UserIcon } from "lucide-react";

import { useUser } from "@/components/user-provider";
import { getRandomAvatarColor } from "@/utils/color-hash";

export const CurrentUserAvatar = ({
  size = "md",
  className,
}: Omit<UserAvatarProps, "name">) => {
  const { user } = useUser();

  return (
    <UserAvatar
      className={className}
      name={user.isGuest ? undefined : user.name}
      size={size}
    />
  );
};

interface UserAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
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
      className={clsx(
        "inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        {
          "size-6 text-sm": size === "sm",
          "size-8 text-base": size === "md",
          "size-14 text-2xl": size === "lg",
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
        <UserIcon
          className={clsx({
            "size-4": size === "sm",
            "size-6": size === "md",
            "size-8": size === "lg",
          })}
        />
      )}
    </span>
  );
};
