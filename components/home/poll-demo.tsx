import { format } from "date-fns";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useTimeoutFn } from "react-use";

import DateCard from "../date-card";
import Score from "../poll/score";
import UserAvater from "../poll/user-avatar";
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
  const [bestOption, setBestOption] = React.useState<number>();
  useTimeoutFn(() => {
    setBestOption(2);
  }, 1500);

  return (
    <div
      className="rounded-lg border bg-white shadow-md"
      style={{ width: 600 }}
    >
      <div className="flex border-b shadow-sm">
        <div
          className="flex shrink-0 items-center py-4 pl-4 pr-2 font-medium"
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
              className="shrink-0 py-4 text-center transition-colors"
              style={{ width: 100 }}
            >
              <DateCard
                day={format(d, "dd")}
                dow={format(d, "E")}
                month={format(d, "MMM")}
                annotation={
                  <Score count={score} highlight={i === bestOption} />
                }
              />
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
            <UserAvater
              className="mr-2"
              color={participant.color}
              name={participant.name}
            />
            <span className="truncate" title={participant.name}>
              {participant.name}
            </span>
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
