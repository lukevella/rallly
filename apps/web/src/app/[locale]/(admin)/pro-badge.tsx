"use client";

import { Badge } from "@rallly/ui/badge";

import { useUser } from "@/auth/client/user-provider";
import { Trans } from "@/components/trans";

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
