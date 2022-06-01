import { format } from "date-fns";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { ScoreSummary } from "../poll/score-summary";
import UserAvatar from "../poll/user-avatar";
import VoteIcon from "../poll/vote-icon";

const sidebarWidth = 180;
const participants = [
  {
    name: "Reed",
    color: "bg-sky-400",
    votes: [0, 2],
  },
  {
    name: "Susan",
    color: "bg-blue-400",
    votes: [0, 1, 2],
  },
  {
    name: "Johnny",
    color: "bg-indigo-400",
    votes: [2, 3],
  },
  {
    name: "Ben",
    color: "bg-purple-400",
    votes: [0, 1, 2, 3],
  },
];

const options = ["2022-12-14", "2022-12-15", "2022-12-16", "2022-12-17"];

const PollDemo: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  return (
    <div
      className="rounded-lg border bg-white shadow-md"
      style={{ width: 600 }}
    >
      <div className="flex border-b shadow-sm">
        <div
          className="flex shrink-0 items-center py-2 pl-4 pr-2 font-medium"
          style={{ width: sidebarWidth }}
        >
          <div className="flex h-full grow items-end">
            {t("participantCount", { count: participants.length })}
          </div>
        </div>
        {options.map((option, i) => {
          const d = new Date(option);
          let score = 0;
          participants.forEach((participant) => {
            if (participant.votes.includes(i)) {
              score++;
            }
          });
          return (
            <div
              key={i}
              className="shrink-0 space-y-3 py-2 pt-3 text-center transition-colors"
              style={{ width: 100 }}
            >
              <div>
                <div className="font-semibold leading-9">
                  <div className="text-sm uppercase text-slate-400">
                    {format(d, "E")}
                  </div>
                  <div className="text-2xl">{format(d, "dd")}</div>
                  <div className="text-xs font-medium uppercase text-slate-400/75">
                    {format(d, "MMM")}
                  </div>
                </div>
              </div>
              <div>
                <ScoreSummary yesScore={score} />
              </div>
            </div>
          );
        })}
      </div>
      {participants.map((participant, i) => (
        <div className="flex h-14" key={i}>
          <div
            className="flex shrink-0 items-center px-4"
            style={{ width: sidebarWidth }}
          >
            <UserAvatar
              color={participant.color}
              name={participant.name}
              showName={true}
            />
          </div>
          <div className="flex">
            {options.map((_, i) => {
              return (
                <div
                  key={i}
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: 100 }}
                >
                  {participant.votes.some((vote) => vote === i) ? (
                    <VoteIcon type="yes" />
                  ) : (
                    <VoteIcon type="no" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PollDemo;
