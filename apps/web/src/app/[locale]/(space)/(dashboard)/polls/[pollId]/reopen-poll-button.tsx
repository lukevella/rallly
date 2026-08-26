"use client";

import { Button } from "@rallly/ui/button";
import { reopenPollAction } from "@/features/poll/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function ReopenPollButton({ pollId }: { pollId: string }) {
  const reopenPoll = useSafeAction(reopenPollAction);

  return (
    <Button
      loading={reopenPoll.isExecuting}
      onClick={() => {
        reopenPoll.execute({ pollId });
      }}
    >
      <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
    </Button>
  );
}
