"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ArrowUpRightIcon, WebhookIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import { showPayWall } from "@/features/billing/client";
import { Trans } from "@/i18n/client";
import { getWebhookDocsPath } from "../constants";

export function WebhooksUpgrade() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <WebhookIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="webhooksUpgradeTitle" defaults="Upgrade for webhooks" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="webhooksUpgradeDescription"
          defaults="Get notified at your own endpoint when a poll is closed, reopened or scheduled. Included with Pro."
        />
      </EmptyStateDescription>
      <EmptyStateFooter className="flex flex-wrap justify-center gap-2">
        <Button
          variant="primary"
          onClick={() => {
            showPayWall({ from: "webhooks" });
          }}
        >
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </Button>
        <Link
          href={getWebhookDocsPath()}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          <Trans i18nKey="webhookDocs" defaults="Webhook docs" />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}
