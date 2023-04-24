import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { stringToValue } from "@/utils/string-to-value";

import Badge from "../badge";

export interface UserAvaterProps {
  name: string;
  className?: string;
  size?: "default" | "large";
  color?: string;
  showName?: boolean;
  isYou?: boolean;
}

const UserAvatarContext = React.createContext<
  ((name: string) => string) | null
>(null);

const colors = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

const defaultColor = "bg-slate-400";

export const UserAvatarProvider: React.FunctionComponent<{
  children?: React.ReactNode;
  names: string[];
  seed: string;
}> = ({ seed, children, names }) => {
  const seedValue = React.useMemo(() => stringToValue(seed), [seed]);

  const colorByName = React.useMemo(() => {
    const res: Record<string, string> = {
      "": defaultColor,
    };
    for (let i = names.length - 1; i >= 0; i--) {
      const name = names[i].trim().toLowerCase();
      const color = colors[(seedValue + names.length - i) % colors.length];
      res[name] = color;
    }
    return res;
  }, [names, seedValue]);

  const getColor = React.useCallback(
    (name: string) => {
      const cachedColor = colorByName[name.toLowerCase()];
      if (cachedColor) {
        return cachedColor;
      }
      return defaultColor;
    },
    [colorByName],
  );

  return (
    <UserAvatarContext.Provider value={getColor}>
      {children}
    </UserAvatarContext.Provider>
  );
};

const UserAvatarInner: React.FunctionComponent<UserAvaterProps> = ({
  name,
  className,
  color: colorOverride,
  size = "default",
}) => {
  const trimmedName = name.trim();

  const getColor = React.useContext(UserAvatarContext);

  if (!getColor) {
    throw new Error("Forgot to wrap UserAvatarProvider");
  }

  const color = colorOverride ?? getColor(trimmedName);
  return (
    <span
      className={clsx(
        "inline-block shrink-0 rounded-full text-center text-white",
        color,
        {
          "h-6 w-6 text-xs leading-6": size === "default",
          "h-10 w-10 leading-10": size === "large",
        },
        className,
      )}
    >
      {trimmedName[0]?.toUpperCase()}
    </span>
  );
};

const UserAvatar: React.FunctionComponent<UserAvaterProps> = ({
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
        "inline-flex items-center space-x-2 overflow-hidden",
        className,
      )}
    >
      <UserAvatarInner {...forwardedProps} />
      <div className="min-w-0 truncate">{forwardedProps.name}</div>
      {isYou ? <Badge>{t("you")}</Badge> : null}
    </div>
  );
};

export default UserAvatar;
