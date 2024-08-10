"use client";

import { Badge } from "@rallly/ui/badge";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

export function ProBadge() {
  const { user } = useUser();

  if (user.tier !== "pro") {
    return null;
  }

  return (
    <Badge variant="primary">
      <Trans i18nKey="planPro" />
    </Badge>
  );
}
