import { cn } from "@rallly/ui";
import Head from "next/head";
import React from "react";

import { Poll } from "@/components/poll";
import { usePoll } from "@/contexts/poll";

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
      <div>
        {props.children}
        <div className={cn(props.className)}>
          <Poll />
        </div>
      </div>
    </>
  );
};

export default ParticipantPage;
