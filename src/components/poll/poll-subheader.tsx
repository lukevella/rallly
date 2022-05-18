import { formatRelative } from "date-fns";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { trpc } from "../../utils/trpc";
import Badge from "../badge";
import Button from "../button";
import { usePoll } from "../poll-context";
import Popover from "../popover";
import { usePreferences } from "../preferences/use-preferences";
import Tooltip from "../tooltip";

const PollSubheader: React.VoidFunctionComponent = () => {
  const { poll } = usePoll();
  const { t } = useTranslation("app");
  const { locale } = usePreferences();
  const requestVerificationEmail = trpc.useMutation(
    "polls.verification.request",
  );

  return (
    <div className="text-slate-500">
      <div className="md:inline">
        <Trans
          i18nKey="createdBy"
          t={t}
          values={{
            name: poll.authorName,
          }}
          components={{
            b: <span className="font-medium text-indigo-500" />,
          }}
        />
        &nbsp;
        <span className="inline-flex items-center space-x-1">
          {poll.role === "admin" ? (
            poll.verified ? (
              <Badge color="green">Verified</Badge>
            ) : (
              <Popover
                trigger={
                  <button className="inline-flex h-5 items-center rounded-md bg-slate-200 px-1 text-xs text-slate-500 transition-colors hover:bg-slate-300 hover:shadow-sm active:bg-slate-200">
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
                  {requestVerificationEmail.isSuccess ? (
                    <div className="text-green-500">
                      Verification email sent.
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        requestVerificationEmail.mutate({
                          pollId: poll.pollId,
                          adminUrlId: poll.urlId,
                        });
                      }}
                      loading={requestVerificationEmail.isLoading}
                    >
                      Resend verification email
                    </Button>
                  )}
                </div>
              </Popover>
            )
          ) : null}
          {poll.legacy && poll.role === "admin" ? (
            <Tooltip
              width={400}
              content="This poll was created with an older version of Rallly. Some features might not work."
            >
              <Badge color="amber">Legacy</Badge>
            </Tooltip>
          ) : null}
        </span>
      </div>
      <span className="hidden md:inline">&nbsp;&bull;&nbsp;</span>
      <span className="whitespace-nowrap">
        {formatRelative(new Date(poll.createdAt), new Date(), {
          locale,
        })}
      </span>
    </div>
  );
};

export default PollSubheader;
