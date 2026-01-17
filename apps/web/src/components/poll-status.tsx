import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";

import { Trans } from "@/components/trans";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";

const PollStatusLabel = ({ status }: { status: PollStatus }) => {
  switch (status) {
    case "open":
      return <Trans i18nKey="pollStatusOpen" defaults="Open" />;
    case "closed":
      return <Trans i18nKey="pollStatusClosed" defaults="Closed" />;
    case "scheduled":
      return <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />;
    case "canceled":
      return <Trans i18nKey="pollStatusCanceled" defaults="Canceled" />;
  }
};

export const PollStatusBadge = ({
  status,
  className,
}: {
  status: PollStatus;
  className?: string;
}) => {
  return (
    <span className={cn("inline-flex items-center gap-x-2 text-sm", className)}>
      <PollStatusIcon status={status} />
      <PollStatusLabel status={status} />
    </span>
  );
};
