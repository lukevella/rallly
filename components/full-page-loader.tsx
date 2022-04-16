import clsx from "clsx";
import * as React from "react";

import Spinner from "./icons/spinner.svg";

interface FullPageLoaderProps {
  className?: string;
  children?: React.ReactNode;
}

const FullPageLoader: React.VoidFunctionComponent<FullPageLoaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(" flex h-full items-center justify-center", className)}
    >
      <div className="flex items-center rounded-lg bg-indigo-500 px-4 py-3 text-sm text-white shadow-sm">
        <Spinner className="mr-3 h-5 animate-spin" />
        {children}
      </div>
    </div>
  );
};

export default FullPageLoader;
