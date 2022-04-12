import { formatRelative } from "date-fns";
import * as React from "react";
import { Trans, useTranslation } from "next-i18next";
import Tooltip from "../tooltip";
import { usePoll } from "../use-poll";

export interface PollSubheaderProps {}

const PollSubheader: React.VoidFunctionComponent<PollSubheaderProps> = () => {
  const poll = usePoll();
  const { t } = useTranslation("app");
  return (
    <div className="text-slate-500">
      <div className="md:inline">
        <Trans
          i18nKey="createdBy"
          t={t}
          values={{
            name: poll.authorName,
            date: Date.parse(poll.createdAt),
            formatParams: {
              date: {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              },
            },
          }}
          components={{
            b: <span className="font-medium text-indigo-500" />,
          }}
        />
        &nbsp;
        {poll.role === "admin" ? (
          poll.verified ? (
            <span className="badge border-green-400 bg-green-50 text-green-500">
              Verified
            </span>
          ) : (
            <Tooltip
              content={
                <div className="max-w-sm">
                  <Trans
                    t={t}
                    i18nKey="unverifiedMessage"
                    values={{ email: poll.user.email }}
                    components={{
                      b: <span className="email" />,
                    }}
                  />
                </div>
              }
            >
              <span className="badge text-slate-400">Unverified</span>
            </Tooltip>
          )
        ) : null}
      </div>
      <span className="hidden md:inline">&nbsp;&bull;&nbsp;</span>
      <span className="whitespace-nowrap">
        {formatRelative(new Date(poll.createdAt), new Date())}
      </span>
    </div>
  );
};

export default PollSubheader;
