"use client";

import { Badge } from "@rallly/ui/badge";
import { Trans } from "@/i18n/client";

export function EarlySupporterBadge() {
  return (
    <Badge variant="secondary">
      <Trans i18nKey="earlySupporter" defaults="Early supporter" />
    </Badge>
  );
}
