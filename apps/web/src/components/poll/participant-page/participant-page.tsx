import { cn } from "@rallly/ui";
import Head from "next/head";
import React from "react";

import { Poll } from "@/components/poll";
import { usePoll } from "@/contexts/poll";
import { DayjsProvider } from "@/utils/dayjs";

import ModalProvider from "../../modal/modal-provider";

const ParticipantPage = (
  props: React.PropsWithChildren<{ className?: string }>,
) => {
  const poll = usePoll();

  if (!poll) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{poll.title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <DayjsProvider>
        <ModalProvider>
          <div>
            {props.children}
            <div className={cn(props.className)}>
              <Poll />
            </div>
          </div>
        </ModalProvider>
      </DayjsProvider>
    </>
  );
};

export default ParticipantPage;
