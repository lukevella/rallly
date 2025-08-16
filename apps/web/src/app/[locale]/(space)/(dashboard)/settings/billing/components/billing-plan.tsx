"use client";

import type React from "react";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import type { SpaceTier } from "@/features/space/schema";

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
    <StackedList>
      <StackedListItem>
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
      </StackedListItem>
    </StackedList>
  );
}
