import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";

import { Trans } from "@/components/trans";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";

export const PollStatusLabel = ({
  status,
  className,
}: {
  status: PollStatus;
  className?: string;
}) => {
  const labels = {
    open: { i18nKey: "pollStatusOpen", defaults: "Open" },
    closed: { i18nKey: "pollStatusClosed", defaults: "Closed" },
    scheduled: { i18nKey: "pollStatusScheduled", defaults: "Scheduled" },
    canceled: { i18nKey: "pollStatusCanceled", defaults: "Canceled" },
  } as const;

  const { i18nKey, defaults } = labels[status];

  return (
    <span className={cn("inline-flex items-center gap-x-2 text-sm", className)}>
      <PollStatusIcon status={status} />
      <Trans i18nKey={i18nKey} defaults={defaults} />
    </span>
  );
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return <PollStatusLabel status={status} />;
};
