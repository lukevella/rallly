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
import { Spinner } from "@/components/spinner";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { dayjs } from "@/lib/dayjs";
import { trpc } from "@/trpc/client";
import { RevokeApiKeyButton } from "./revoke-api-key-button";

export function ApiKeysList() {
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();

  if (apiKeys === undefined) {
    return <Spinner />;
  }

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
                  date: dayjs(apiKey.lastUsedAt).fromNow(),
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
