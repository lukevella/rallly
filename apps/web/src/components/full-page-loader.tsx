import clsx from "clsx";
import * as React from "react";

import Spinner from "./icons/spinner.svg";

interface FullPageLoaderProps {
  className?: string;
  children?: React.ReactNode;
}

const FullPageLoader: React.FunctionComponent<FullPageLoaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(" flex h-full items-center justify-center", className)}
    >
      <div className="bg-primary-500 flex items-center rounded-lg px-4 py-3 text-sm text-white shadow-sm">
        <Spinner className="mr-3 h-5 animate-spin" />
        {children}
      </div>
    </div>
  );
};

export default FullPageLoader;
