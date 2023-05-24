import React from "react";

import { StandardLayout } from "@/components/layouts/standard-layout";

import { NextPageWithLayout } from "../../types";

export const NewPollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex h-full grow flex-col">
      <div className="grow bg-white">{children}</div>
    </div>
  );
};

export const getNewPolLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <NewPollLayout>{page}</NewPollLayout>
      </StandardLayout>
    );
  };
