"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { BellOffIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { unsubscribeWithTokenAction } from "@/features/notifications/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function MutePollForm({
  token,
  pollId,
  pollTitle,
  initialMuted,
}: {
  token: string;
  pollId: string;
  pollTitle: string;
  initialMuted: boolean;
}) {
  const [muted, setMuted] = React.useState(initialMuted);
  const unsubscribe = useSafeAction(unsubscribeWithTokenAction, {
    onSuccess: ({ data }) => {
      if (data?.ok) {
        setMuted(true);
      }
    },
  });

  if (muted) {
    return (
      <>
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
          <BellOffIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="font-bold text-lg">
            <Trans i18nKey="mutePollDoneTitle" defaults="Poll muted" />
          </h1>
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="mutePollDoneDescription"
              defaults="You will no longer receive emails about <b>{pollTitle}</b>. You can unmute it from the poll page."
              values={{ pollTitle }}
              components={{ b: <strong className="text-foreground" /> }}
            />
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`/poll/${pollId}`}
            className={buttonVariants({ variant: "primary" })}
          >
            <Trans i18nKey="mutePollGoToPoll" defaults="Go to poll" />
          </Link>
          <Link href="/settings/notifications" className={buttonVariants()}>
            <Trans
              i18nKey="mutePollManageSettings"
              defaults="Manage notification settings"
            />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="font-bold text-lg">
          <Trans i18nKey="mutePollConfirmTitle" defaults="Mute this poll?" />
        </h1>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="mutePollConfirmDescription"
            defaults="You will stop receiving emails about new responses and comments on <b>{pollTitle}</b>. Your other polls are not affected."
            values={{ pollTitle }}
            components={{ b: <strong className="text-foreground" /> }}
          />
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          loading={unsubscribe.isExecuting}
          onClick={() => unsubscribe.execute({ token })}
        >
          <Trans i18nKey="muteNotifications" defaults="Mute notifications" />
        </Button>
        <Link href="/settings/notifications" className={buttonVariants()}>
          <Trans
            i18nKey="mutePollManageSettings"
            defaults="Manage notification settings"
          />
        </Link>
      </div>
    </>
  );
}
