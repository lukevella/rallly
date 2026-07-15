"use client";

import { Card } from "@rallly/ui/card";
import type React from "react";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import type { SpaceTier } from "@/features/space/schema";
import { Trans } from "@/i18n/client";

export function BillingPlan({
  tier,
  status,
  seats,
}: {
  tier: SpaceTier;
  status?: React.ReactNode;
  seats: number;
}) {
  return (
    <Card className="flex items-center gap-x-6 p-4">
      <SpaceTierIcon tier={tier} />
      <div className="flex-1">
        <div className="font-semibold text-sm">
          <SpaceTierLabel tier={tier} />
        </div>
        <p className="text-muted-foreground text-sm">{status}</p>
      </div>
      <div className="text-muted-foreground text-sm">
        <Trans
          i18nKey="seatCount"
          defaults="{count, plural, {one, # seat} {other, # seats}}"
          values={{ count: seats }}
        />
      </div>
    </Card>
  );
}
