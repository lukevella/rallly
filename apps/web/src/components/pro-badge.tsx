"use client";
import { Badge } from "@rallly/ui/badge";
import { Trans } from "next-i18next";

import { IfFreeUser } from "@/contexts/plan";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <IfFreeUser>
      <Badge className={className}>
        <Trans i18nKey="planPro" />
      </Badge>
    </IfFreeUser>
  );
};
