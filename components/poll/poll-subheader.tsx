import { formatRelative } from "date-fns";
import * as React from "react";
import { Trans, useTranslation } from "next-i18next";
import Button from "../button";
import { usePoll } from "../use-poll";
import Popover from "../popover";
import { useMutation } from "react-query";
import axios from "axios";

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
            <span className="badge border-green-400 bg-green-50 text-green-500">
              Verified
            </span>
          ) : (
            <Popover
              trigger={
                <button className="badge transition-colors hover:text-indigo-500 hover:border-slate-300 hover:bg-slate-100 cursor-pointer text-slate-400">
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
                        <span className="text-indigo-500 font-medium font-mono whitespace-nowrap" />
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
