import clsx from "clsx";
import React from "react";

import { PropsWithClassName } from "@/types";

export const Skeleton = (props: PropsWithClassName) => {
  return (
    <div
      className={clsx("animate-pulse rounded-md bg-gray-200", props.className)}
    >
      {props.children}
    </div>
  );
};
