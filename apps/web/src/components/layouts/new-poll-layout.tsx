import React from "react";

import { UserProvider } from "@/components/user-provider";
import { DayjsProvider } from "@/utils/dayjs";

import { NextPageWithLayout } from "../../types";

export const NewPollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <UserProvider>
      <DayjsProvider>{children}</DayjsProvider>
    </UserProvider>
  );
};

export const getNewPolLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <NewPollLayout>{page}</NewPollLayout>;
  };
