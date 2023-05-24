import { ChartSquareBarIcon } from "@rallly/icons";
import React from "react";
import { Trans } from "react-i18next";

import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";

import { NextPageWithLayout } from "../../types";

export const NewPollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex h-full grow flex-col">
      <div className="grow bg-white p-8">{children}</div>
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
