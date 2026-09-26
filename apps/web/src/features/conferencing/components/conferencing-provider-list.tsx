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
import { MoreVerticalIcon, UnplugIcon } from "lucide-react";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { disconnectConferencingConnectionAction } from "@/features/conferencing/actions";
import { connectToConferencing } from "@/features/conferencing/client";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import {
  conferencingProviderIntegrations,
  conferencingProviderLabels,
} from "@/features/conferencing/utils";
import { Trans, useTranslation } from "@/i18n/client";

export function ConferencingProviderList({
  providers,
}: {
  providers: {
    provider: ConferencingProvider;
    connection: { id: string; email: string } | null;
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

  return (
    <StackedList>
      {providers.map(({ provider, connection }) => (
        <StackedListItem
          key={provider}
          className="gap-x-4 hover:bg-transparent"
        >
          <span className="shrink-0">
            <ConferencingProviderIcon provider={provider} size={32} />
          </span>
          <p className="shrink-0 font-semibold text-sm">
            {conferencingProviderLabels[provider]}
          </p>
          <div className="ml-auto flex min-w-0 items-center gap-x-2">
            {connection ? (
              <>
                <p className="truncate text-muted-foreground text-sm">
                  {connection.email}
                </p>
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
              </>
            ) : (
              <Button
                onClick={() => {
                  connectToConferencing(
                    conferencingProviderIntegrations[provider].integrationId,
                  );
                }}
              >
                <Trans i18nKey="connect" defaults="Connect" />
              </Button>
            )}
          </div>
        </StackedListItem>
      ))}
    </StackedList>
  );
}
