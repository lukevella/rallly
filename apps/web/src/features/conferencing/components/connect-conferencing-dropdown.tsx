"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { connectToConferencing } from "@/features/conferencing/client";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import {
  conferencingProviderIntegrations,
  conferencingProviderLabels,
} from "@/features/conferencing/utils";
import { Trans } from "@/i18n/client";

export function ConnectConferencingDropdown({
  providers,
}: {
  providers: ConferencingProvider[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        <Trans i18nKey="connectAccount" defaults="Connect account" />
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {providers.map((provider) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => {
              connectToConferencing(
                conferencingProviderIntegrations[provider].integrationId,
              );
            }}
          >
            <ConferencingProviderIcon provider={provider} size={16} />
            {conferencingProviderLabels[provider]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
