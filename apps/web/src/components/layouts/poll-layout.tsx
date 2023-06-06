import React from "react";

import { StandardLayout } from "@/components/layouts/standard-layout";
import { AdminControls } from "@/components/poll/participant-page/admin-controls";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";

import { NextPageWithLayout } from "../../types";

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <LegacyPollContextProvider>
      <div className="flex min-w-0 grow flex-col">
        <AdminControls />
        {children}
      </div>
    </LegacyPollContextProvider>
  );
};

export const getPollLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <PollLayout>{page}</PollLayout>
      </StandardLayout>
    );
  };
