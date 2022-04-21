import clsx from "clsx";
import * as React from "react";
import { stringToValue } from "utils/string-to-value";

export interface UserAvaterProps {
  name: string;
  className?: string;
  size?: "default" | "large";
  color?: string;
}

const UserAvatarContext =
  React.createContext<((name: string) => string) | null>(null);

const colors = [
  "bg-fuchsia-300",
  "bg-purple-400",
  "bg-indigo-400",
  "bg-blue-400",
  "bg-sky-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-purple-400",
  "bg-fuchsia-400",
  "bg-pink-400",
];

const defaultColor = "bg-slate-400";

export const UserAvatarProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  names: string[];
  seed: string;
}> = ({ seed, children, names }) => {
  const seedValue = React.useMemo(() => stringToValue(seed), [seed]);

  const colorByName = React.useMemo(() => {
    const res = {
      "": defaultColor,
    };
    for (let i = 0; i < names.length; i++) {
      const lastIndex = names.length - 1;
      // start from the end since the names is "most recent" first.
      const name = names[lastIndex - i].trim().toLowerCase();
      const color = colors[(seedValue + i) % colors.length];
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

const UserAvater: React.VoidFunctionComponent<UserAvaterProps> = ({
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
        "inline-block h-5 w-5 shrink-0 rounded-full text-center text-white",
        color,
        {
          "h-5 w-5 text-xs leading-5": size === "default",
          "h-10 w-10 leading-10": size === "large",
        },
        className,
      )}
      title={name}
    >
      {trimmedName[0]?.toUpperCase()}
    </span>
  );
};

export default UserAvater;
