import { Trans, useTranslation } from "next-i18next";

import { trpc } from "../../utils/trpc";
import { Button } from "../button";
import { usePoll } from "../poll-context";

export const UnverifiedPollNotice = () => {
  const { t } = useTranslation("app");
  const { poll } = usePoll();
  const requestVerificationEmail = trpc.useMutation(
    "polls.verification.request",
  );

  return (
    <div>
      <div className="md:flex md:justify-between md:space-x-4">
        <div className="mb-4 md:mb-0 md:w-2/3">
          <Trans
            t={t}
            i18nKey="unverifiedMessage"
            values={{ email: poll.user.email }}
            components={{
              b: (
                <span className="whitespace-nowrap font-medium text-slate-700" />
              ),
            }}
          />
        </div>
        <Button
          onClick={() => {
            requestVerificationEmail.mutate({
              pollId: poll.id,
              adminUrlId: poll.adminUrlId,
            });
          }}
          disabled={requestVerificationEmail.isSuccess}
          loading={requestVerificationEmail.isLoading}
        >
          {requestVerificationEmail.isSuccess
            ? "Vertification email sent"
            : "Resend verification email"}
        </Button>
      </div>
    </div>
  );
};
