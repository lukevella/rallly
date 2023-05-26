import clsx from "clsx";
import React from "react";

import { IconComponent } from "@/types";

export const TopBar = (
  props: React.PropsWithChildren<{
    title?: React.ReactNode;
    className?: string;
  }>,
) => {
  return (
    <div
      className={clsx(
        "sticky top-0 z-20 border-b bg-gray-50/75 p-3 backdrop-blur-lg",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};

export const TopBarTitle = ({
  icon: Icon,
  title,
}: {
  icon: IconComponent;
  title: React.ReactNode;
}) => {
  return (
    <div className="flex h-9 min-w-0 items-center gap-2">
      <div>
        <Icon className="text-primary-600 h-6 w-6" />
      </div>
      <div className="truncate font-semibold">{title}</div>
    </div>
  );
};
