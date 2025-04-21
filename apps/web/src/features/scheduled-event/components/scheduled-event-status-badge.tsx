import { Badge } from "@rallly/ui/badge";

import { Trans } from "@/components/trans";
import type { Status } from "@/features/scheduled-event/schema";

export function ScheduledEventStatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "past":
      return (
        <Badge>
          <Trans i18nKey="past" defaults="Past" />
        </Badge>
      );
    case "upcoming":
      return null;
    case "canceled":
      return (
        <Badge>
          <Trans i18nKey="canceled" defaults="Canceled" />
        </Badge>
      );
    case "unconfirmed":
      return (
        <Badge>
          <Trans i18nKey="unconfirmed" defaults="Unconfirmed" />
        </Badge>
      );
  }
}
