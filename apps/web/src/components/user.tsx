import clsx from "clsx";

import { useUser } from "@/components/user-provider";
import { getRandomAvatarColor } from "@/utils/color-hash";
import { UserIcon } from "@rallly/icons";

export const CurrentUserAvatar = ({
  size = "md",
}: Omit<UserAvatarProps, "name">) => {
  const { user } = useUser();

  return <UserAvatar name={user.isGuest ? undefined : user.name} size={size} />;
};

interface UserAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
}

export const UserAvatar = ({ size = "md", name }: UserAvatarProps) => {
  const colors = name ? getRandomAvatarColor(name) : null;
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        {
          "h-6 w-6": size === "sm",
          "h-8 w-8 text-base": size === "md",
          "h-14 w-14 text-2xl": size === "lg",
        },
        !name
          ? "border-2 border-dashed"
          : colors?.requiresDarkText
          ? "text-gray-800"
          : "text-white",
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
            "h-4 w-4": size === "sm",
            "h-6 w-6": size === "md",
            "h-8 w-8": size === "lg",
          })}
        />
      )}
    </span>
  );
};
