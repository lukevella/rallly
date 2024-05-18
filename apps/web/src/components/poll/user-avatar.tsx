import { Badge } from "@rallly/ui/badge";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { getRandomAvatarColor } from "@/utils/color-hash";

interface UserAvatarProps {
  name: string;
  className?: string;
  size?: "default" | "large";
  color?: string;
  showName?: boolean;
  isYou?: boolean;
}

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
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase",
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

const UserAvatarInner: React.FunctionComponent<UserAvatarProps> = ({
  name,
  className,
}) => {
  return <ColoredAvatar name={name} className={className} />;
};

const UserAvatar: React.FunctionComponent<UserAvatarProps> = ({
  showName,
  isYou,
  className,
  ...forwardedProps
}) => {
  const { t } = useTranslation();
  if (!showName) {
    return <UserAvatarInner className={className} {...forwardedProps} />;
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-x-2.5 overflow-hidden",
        className,
      )}
    >
      <UserAvatarInner {...forwardedProps} />
      <div className="min-w-0 truncate text-sm font-medium">
        {forwardedProps.name}
      </div>
      {isYou ? <Badge>{t("you")}</Badge> : null}
    </div>
  );
};

export default UserAvatar;

export const YouAvatar = () => {
  const { t } = useTranslation();
  const you = t("you");
  return (
    <span className="inline-flex items-center gap-x-2.5 text-sm">
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold uppercase">
        {you[0]}
      </span>
      {t("you")}
    </span>
  );
};
