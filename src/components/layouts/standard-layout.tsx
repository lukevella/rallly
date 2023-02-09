import React from "react";

import { DayjsProvider } from "@/utils/dayjs";

import { NextPageWithLayout } from "../../types";
import { UserProvider } from "../user-provider";
import { MobileNavigation } from "./standard-layout/mobile-navigation";

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <UserProvider>
      <DayjsProvider>
        <div className={"bg-pattern relative min-h-full"} {...rest}>
          <MobileNavigation />
          <div className="mx-auto max-w-4xl">{children}</div>
        </div>
      </DayjsProvider>
    </UserProvider>
  );
};

export default StandardLayout;

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
