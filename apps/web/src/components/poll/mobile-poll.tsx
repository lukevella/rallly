import { Card, CardContent, CardFooter } from "@rallly/ui/card";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type * as React from "react";
import smoothscroll from "smoothscroll-polyfill";

import { TimesShownIn } from "@/components/clock";
import {
  VotingControlBar,
  VotingSubmitButton,
} from "@/components/poll/voting-controls";
import { useVotingForm } from "@/components/poll/voting-form";
import { useOptions, usePoll } from "@/components/poll-context";

import GroupedOptions from "./mobile-poll/grouped-options";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const { poll } = usePoll();

  const { options } = useOptions();

  const votingForm = useVotingForm();

  const selectedParticipantId = votingForm.watch("participantId");

  const isEditing = votingForm.watch("mode") !== "view";

  return (
    <Card>
      <div className="flex flex-col space-y-2 border-b p-2">
        <VotingControlBar />
      </div>
      {poll.options[0]?.duration !== 0 && poll.timeZone ? (
        <CardContent className="border-b">
          <TimesShownIn />
        </CardContent>
      ) : null}
      <GroupedOptions
        selectedParticipantId={selectedParticipantId}
        options={options}
        editable={isEditing}
        group={(option) => {
          if (option.type === "timeSlot") {
            return `${option.dow} ${option.day} ${option.month} ${option.year}`;
          }
          return `${option.month} ${option.year}`;
        }}
      />
      <AnimatePresence>
        {isEditing ? (
          <m.div
            variants={{
              hidden: { opacity: 0, y: -20, height: 0 },
              visible: { opacity: 1, y: 0, height: "auto" },
            }}
            initial="hidden"
            animate="visible"
            exit={{
              opacity: 0,
              y: -10,
              height: 0,
              transition: { duration: 0.2 },
            }}
          >
            <CardFooter className="border-t">
              <VotingSubmitButton className="w-full" />
            </CardFooter>
          </m.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
};

export default MobilePoll;
