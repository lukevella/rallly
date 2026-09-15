"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ArrowUpRightIcon, TerminalIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import {
  API_RATE_LIMIT_PER_MINUTE,
  getApiDocsPath,
} from "@/features/api-keys/constants";
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
      <EmptyStateFooter className="flex flex-wrap justify-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            showPayWall({ from: "api-keys" });
          }}
        >
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </Button>
        <Link
          href={getApiDocsPath()}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          <Trans i18nKey="apiReference" defaults="API reference" />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}
