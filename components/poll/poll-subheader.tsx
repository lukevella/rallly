import axios from "axios";
import { formatRelative } from "date-fns";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { useMutation } from "react-query";

import Button from "../button";
import Popover from "../popover";
import { usePoll } from "../use-poll";

export interface PollSubheaderProps {}

const PollSubheader: React.VoidFunctionComponent<PollSubheaderProps> = () => {
  const poll = usePoll();
  const { t } = useTranslation("app");

  const {
    mutate: sendVerificationEmail,
    isLoading: isSendingVerificationEmail,
    isSuccess: didSendVerificationEmail,
  } = useMutation(async () => {
    await axios.post(`/api/poll/${poll.urlId}/verify`);
  });
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
            <span className="inline-block cursor-default rounded-lg border border-green-400 bg-green-50 px-1 text-sm text-green-500">
              Verified
            </span>
          ) : (
            <Popover
              trigger={
                <button className="inline-block rounded-lg border px-2 text-sm text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-sm active:bg-gray-100">
                  Unverified
                </button>
              }
            >
              <div className="max-w-sm">
                <div className="mb-4">
                  <Trans
                    t={t}
                    i18nKey="unverifiedMessage"
                    values={{ email: poll.user.email }}
                    components={{
                      b: (
                        <span className="whitespace-nowrap font-mono font-medium text-indigo-500" />
                      ),
                    }}
                  />
                </div>
                {didSendVerificationEmail ? (
                  <div className="text-green-500">Verification email sent.</div>
                ) : (
                  <Button
                    onClick={() => {
                      sendVerificationEmail();
                    }}
                    loading={isSendingVerificationEmail}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            </Popover>
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
