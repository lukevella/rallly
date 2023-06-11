import { cn } from "@rallly/ui";
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
