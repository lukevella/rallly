import { UserIcon } from "@rallly/icons";
import clsx from "clsx";

import { useUser } from "@/components/user-provider";
import { getRandomAvatarColor } from "@/utils/color-hash";

export const CurrentUserAvatar = () => {
  const { user } = useUser();

  if (user.isGuest) {
    return (
      <span
        className={clsx(
          "inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-dashed font-semibold md:h-8 md:w-8",
        )}
      >
        <UserIcon className="h-4" />
      </span>
    );
  }

  const { color, requiresDarkText } = getRandomAvatarColor(user.name);
  return (
    <span
      className={clsx(
        "inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full font-semibold md:h-8 md:w-8",
        requiresDarkText ? "text-gray-800" : "text-white",
      )}
      style={{
        backgroundColor: !user.isGuest ? color : undefined,
      }}
    >
      <div className="text-sm md:text-base">{user.shortName[0]}</div>
    </span>
  );
};
