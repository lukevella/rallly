import React from "react";

import { UserProvider } from "@/components/user-provider";

import { NextPageWithLayout } from "../../types";

export const NewPollLayout = ({ children }: React.PropsWithChildren) => {
  return <UserProvider>{children}</UserProvider>;
};

export const getNewPolLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <NewPollLayout>{page}</NewPollLayout>;
  };
