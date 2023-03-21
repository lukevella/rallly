import { domMax, LazyMotion } from "framer-motion";
import dynamic from "next/dynamic";
import React from "react";

import { DayjsProvider } from "@/utils/dayjs";

import { NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { UserProvider } from "../user-provider";
import { MobileNavigation } from "./standard-layout/mobile-navigation";

const Feedback = dynamic(() => import("../feedback"), { ssr: false });

const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <LazyMotion features={domMax}>
      <UserProvider>
        <DayjsProvider>
          <ModalProvider>
            <div className="bg-pattern relative min-h-full" {...rest}>
              {process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ? <Feedback /> : null}
              <MobileNavigation />
              <div className="mx-auto max-w-4xl grow">{children}</div>
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
