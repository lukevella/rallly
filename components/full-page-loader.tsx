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
      className={clsx(" h-full flex items-center justify-center", className)}
    >
      <div className="bg-indigo-500 text-white text-sm px-4 py-3 shadow-sm rounded-lg flex items-center">
        <Spinner className="h-5 mr-3 animate-spin" />
        {children}
      </div>
    </div>
  );
};

export default FullPageLoader;
