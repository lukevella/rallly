import clsx from "clsx";

export const styleMenuItem = ({
  active,
  selected,
}: {
  active: boolean;
  selected: boolean;
}) =>
  clsx("menu-item text-sm", {
    "font-medium": selected,
    "bg-blue-50": active,
  });
