import { domMax, LazyMotion, m } from "framer-motion";
import React from "react";

import { DayjsProvider } from "@/utils/dayjs";

import { NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { UserProvider } from "../user-provider";
import { MobileNavigation } from "./standard-layout/mobile-navigation";

const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <LazyMotion features={domMax}>
      <UserProvider>
        <DayjsProvider>
          <ModalProvider>
            <div className={"bg-pattern relative min-h-full"} {...rest}>
              <MobileNavigation />
              <div className="mx-auto max-w-4xl">{children}</div>
            </div>
          </ModalProvider>
        </DayjsProvider>
      </UserProvider>
    </LazyMotion>
  );
};

export default StandardLayout;

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
