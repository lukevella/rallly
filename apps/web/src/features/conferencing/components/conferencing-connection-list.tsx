"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { MoreVerticalIcon, UnplugIcon, VideoIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { disconnectConferencingConnectionAction } from "@/features/conferencing/actions";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import { Trans, useTranslation } from "@/i18n/client";

export function ConferencingConnectionList({
  connections,
}: {
  connections: {
    id: string;
    provider: ConferencingProvider;
    email: string;
    displayName: string | null;
  }[];
}) {
  const { t } = useTranslation();
  const disconnect = useMutation(
    mutationOptions(disconnectConferencingConnectionAction, {
      onSuccess: () => {
        toast.success(
          t("conferencingDisconnected", {
            defaultValue: "Account disconnected",
          }),
        );
      },
    }),
  );

  if (connections.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <VideoIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="noConferencingAccounts"
            defaults="No accounts connected"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="noConferencingAccountsDescription"
            defaults="Connect an account and we'll add a meeting link to your events for you."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-4">
      {connections.map((connection) => (
        <li
          key={connection.id}
          className="flex items-center gap-x-4 rounded-xl border p-4"
        >
          <ConferencingProviderIcon provider={connection.provider} size={32} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">
              {connection.displayName ??
                conferencingProviderLabels[connection.provider]}
            </p>
            <p className="truncate text-muted-foreground text-sm">
              {connection.email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t("moreOptions", {
                    defaultValue: "More options",
                  })}
                  variant="ghost"
                  size="icon"
                />
              }
            >
              <MoreVerticalIcon className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  disconnect.mutate({ id: connection.id });
                }}
              >
                <UnplugIcon />
                <Trans i18nKey="disconnect" defaults="Disconnect" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      ))}
    </ul>
  );
}
