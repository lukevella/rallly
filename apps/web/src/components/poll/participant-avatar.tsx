import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { getRandomAvatarColor } from "@/utils/color-hash";

import Badge from "../badge";

export interface UserAvaterProps {
  name: string;
  seed?: string;
  className?: string;
  size?: "default" | "large";
  color?: string;
  showName?: boolean;
  isYou?: boolean;
}

const UserAvatar: React.FunctionComponent<UserAvaterProps> = ({
  showName,
  isYou,
  className,
  ...forwardedProps
}) => {
  const { t } = useTranslation();
  if (!showName) {
    return (
      <ColoredAvatar
        seed={forwardedProps.seed}
        className={className}
        name={forwardedProps.name}
      />
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center space-x-3 overflow-hidden",
        className,
      )}
    >
      <span>
        <ColoredAvatar seed={forwardedProps.seed} name={forwardedProps.name} />
      </span>
      <span className="min-w-0 truncate font-medium">
        {forwardedProps.name}
      </span>
      {isYou ? <Badge>{t("you")}</Badge> : null}
    </span>
  );
};

export default UserAvatar;

export const ColoredAvatar = (props: {
  seed?: string;
  name: string;
  className?: string;
}) => {
  const { color, requiresDarkText } = getRandomAvatarColor(
    props.seed ?? props.name,
  );
  return (
    <div
      className={clsx(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
        requiresDarkText ? "text-gray-800" : "text-white",
        props.className,
      )}
      style={{
        backgroundColor: color,
      }}
    >
      {props.name[0]}
    </div>
  );
};
