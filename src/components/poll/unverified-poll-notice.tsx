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
    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-100 p-3 text-gray-700 shadow-sm">
      <div className="px-1">
        <Trans
          t={t}
          i18nKey="unverifiedMessage"
          values={{ email: poll.user.email }}
          components={{
            b: <span className="whitespace-nowrap font-bold text-slate-700" />,
          }}
        />
      </div>
      <div>
        <Button
          onClick={() => {
            requestVerificationEmail.mutate({
              pollId: poll.id,
              adminUrlId: poll.adminUrlId,
            });
          }}
          loading={requestVerificationEmail.isLoading}
          className="rounded px-3 py-2 font-semibold shadow-sm"
          disabled={requestVerificationEmail.isSuccess}
        >
          {requestVerificationEmail.isSuccess
            ? "Vertification email sent"
            : "Resend verification email"}
        </Button>
      </div>
    </div>
  );
};
