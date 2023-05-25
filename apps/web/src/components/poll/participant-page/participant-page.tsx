import Head from "next/head";
import React from "react";

import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { usePoll } from "@/contexts/poll";
import { DayjsProvider } from "@/utils/dayjs";

import ModalProvider from "../../modal/modal-provider";

const ParticipantPage = (props: React.PropsWithChildren) => {
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
        <ParticipantsProvider pollId={poll.id}>
          <PollContextProvider
            poll={poll}
            urlId={poll.participantUrlId}
            admin={false}
          >
            <ModalProvider>
              <div>
                {props.children}
                <div className="mx-auto w-full max-w-4xl space-y-3 sm:space-y-4">
                  <Poll />
                </div>
              </div>
            </ModalProvider>
          </PollContextProvider>
        </ParticipantsProvider>
      </DayjsProvider>
    </>
  );
};

export default ParticipantPage;
