import { Participant } from "@prisma/client";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import UserAvater from "../user-avatar";
import VoteIcon from "../vote-icon";
import PopularityScore from "./popularity-score";

export interface PollOptionProps {
  children?: React.ReactNode;
  numberOfVotes: number;
  editable?: boolean;
  vote?: "yes" | "no";
  onChange: (vote: "yes" | "no") => void;
  participants: Participant[];
  selectedParticipantId?: string;
}

const CollapsibleContainer: React.VoidFunctionComponent<{
  expanded?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children, expanded }) => {
  return (
    <motion.div
      initial={{ width: 0 }}
      variants={{
        collapsed: {
          width: 0,
          opacity: 0,
        },
        expanded: {
          opacity: 1,
          width: 58,
        },
      }}
      animate={expanded ? "expanded" : "collapsed"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const PopInOut: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={clsx(className)}
    >
      {children}
    </motion.div>
  );
};

const PollOption: React.VoidFunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  participants,
  editable,
  numberOfVotes,
}) => {
  const difference = selectedParticipantId
    ? participants.some(({ id }) => id === selectedParticipantId)
      ? vote === "yes"
        ? 0
        : -1
      : vote === "yes"
      ? 1
      : 0
    : vote === "yes"
    ? 1
    : 0;

  const showVotes = !!(selectedParticipantId || editable);
  return (
    <div
      data-testid="poll-option"
      onClick={() => {
        onChange(vote === "yes" ? "no" : "yes");
      }}
      className={clsx(
        "flex items-center space-x-3 px-4 py-3 transition duration-75",
        {
          "active:bg-indigo-50": editable,
          "bg-indigo-50/50": editable && vote === "yes",
        },
      )}
    >
      <div className="pointer-events-none flex grow items-center">
        <div className="grow">{children}</div>
        <div className="flex flex-col items-end">
          <PopularityScore score={numberOfVotes + difference} />
          {participants.length > 0 ? (
            <div className="mt-1 -mr-1">
              <div className="-space-x-1">
                {participants
                  .slice(0, participants.length <= 6 ? 6 : 5)
                  .map((participant, i) => {
                    return (
                      <UserAvater
                        key={i}
                        className="ring-1 ring-white"
                        name={participant.name}
                      />
                    );
                  })}
                {participants.length > 6 ? (
                  <span className="inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-medium ring-1 ring-white">
                    +{participants.length - 5}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <CollapsibleContainer
        expanded={showVotes}
        className="relative flex h-12 items-center justify-center rounded-lg"
      >
        <AnimatePresence>
          {editable ? (
            <PopInOut className="h-full">
              <div className="flex h-full w-14 items-center justify-center">
                <input
                  readOnly={true}
                  type="checkbox"
                  className="checkbox"
                  checked={vote === "yes"}
                />
              </div>
            </PopInOut>
          ) : vote ? (
            <PopInOut
              key={vote}
              className="absolute inset-0 flex h-full w-full items-center justify-center"
            >
              <VoteIcon type={vote} />
            </PopInOut>
          ) : null}
        </AnimatePresence>
      </CollapsibleContainer>
    </div>
  );
};

export default PollOption;
