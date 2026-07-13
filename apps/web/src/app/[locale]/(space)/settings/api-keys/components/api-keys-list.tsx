"use client";

import { Badge } from "@rallly/ui/badge";
import { Icon } from "@rallly/ui/icon";
import { KeyIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import type { getSpaceApiKeys } from "@/features/api-keys/data";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { RevokeApiKeyButton } from "./revoke-api-key-button";

type ApiKey = Awaited<ReturnType<typeof getSpaceApiKeys>>[number];

export function ApiKeysList({ apiKeys }: { apiKeys: ApiKey[] }) {
  const { toRelativeTime } = useDateTime();

  if (apiKeys.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <KeyIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noApiKeys" defaults="No API keys found" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="noApiKeysDescription"
            defaults="Create an API key to access your space programmatically"
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <StackedList>
      {apiKeys.map((apiKey) => (
        <StackedListItem key={apiKey.id}>
          <div className="flex flex-1 items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-card-accent">
              <Icon>
                <KeyIcon />
              </Icon>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm">{apiKey.name}</div>
                {!apiKey.revokedAt ? (
                  <Badge variant="green">
                    <Trans i18nKey="active" defaults="Active" />
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <Trans i18nKey="revoked" defaults="Revoked" />
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                {`sk_${apiKey.prefix}`}
                &bull;&bull;&bull;&bull;
              </div>
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            {apiKey.lastUsedAt ? (
              <Trans
                i18nKey="lastUsedAt"
                defaults="Last used {date}"
                values={{
                  date: toRelativeTime(apiKey.lastUsedAt),
                }}
              />
            ) : (
              <Trans i18nKey="neverUsed" defaults="Never used" />
            )}
          </div>
          {!apiKey.revokedAt ? (
            <RevokeApiKeyButton apiKeyId={apiKey.id} apiKeyName={apiKey.name} />
          ) : null}
        </StackedListItem>
      ))}
    </StackedList>
  );
}
