import React from "react";

import { DayjsProvider } from "@/utils/dayjs";

import { MobileNavigation } from "./standard-layout/mobile-navigation";

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <DayjsProvider>
      <div className="relative min-h-full bg-gray-50" {...rest}>
        <MobileNavigation />
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </DayjsProvider>
  );
};

export default StandardLayout;
