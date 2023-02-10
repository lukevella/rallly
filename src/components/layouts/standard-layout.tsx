import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useRouter } from "next/router";
import React from "react";

import { DayjsProvider } from "@/utils/dayjs";

import { NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { UserProvider } from "../user-provider";
import { MobileNavigation } from "./standard-layout/mobile-navigation";

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  const router = useRouter();
  return (
    <LazyMotion features={domAnimation}>
      <UserProvider>
        <DayjsProvider>
          <ModalProvider>
            <div className={"bg-pattern relative min-h-full"} {...rest}>
              <MobileNavigation />
              <div className="mx-auto max-w-4xl">
                <AnimatePresence initial={false} exitBeforeEnter={true}>
                  <m.div
                    key={router.asPath}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    {children}
                  </m.div>
                </AnimatePresence>
              </div>
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
