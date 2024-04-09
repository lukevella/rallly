"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { CheckCircleIcon, PauseCircleIcon } from "lucide-react";

import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

export function StatusInfo() {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  if (poll.event) {
    return (
      <Alert icon={CheckCircleIcon}>
        <AlertTitle>
          <Trans i18nKey="pollStatusFinalized" />
        </AlertTitle>
        <AlertDescription>
          <Trans
            i18nKey="pollStatusFinalizedDescription"
            defaults="A final date has been selected"
          />
        </AlertDescription>
        <div className="mt-4">
          <Badge>{adjustTimeZone(poll.event.start).format("LLL")}</Badge>
        </div>
      </Alert>
    );
  }

  if (poll.status === "paused") {
    return (
      <Alert icon={PauseCircleIcon}>
        <AlertTitle>
          <Trans i18nKey="pollStatusPaused" />
        </AlertTitle>
        <AlertDescription>
          <Trans
            i18nKey="pollStatusPausedDescription"
            defaults="The poll has been paused. Votes cannot be submitted or edited."
          />
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
