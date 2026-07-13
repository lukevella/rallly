"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { TerminalIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { API_RATE_LIMIT_PER_MINUTE } from "@/features/api-keys/constants";
import { showPayWall } from "@/features/billing/client";
import { Trans } from "@/i18n/client";

export function ApiAccessUpgrade() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <TerminalIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans
          i18nKey="apiAccessUpgradeTitle"
          defaults="Upgrade for API access"
        />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="apiAccessUpgradeDescription"
          defaults="Create API keys to manage your polls programmatically. Included with Pro, with a shared limit of {count} requests per minute across your space."
          values={{ count: API_RATE_LIMIT_PER_MINUTE }}
        />
      </EmptyStateDescription>
      <EmptyStateFooter>
        <Button
          variant="primary"
          onClick={() => {
            posthog?.capture("api_keys:upgrade_button_click");
            showPayWall();
          }}
        >
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
}
