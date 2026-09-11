"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { FormItem, FormLabel } from "@rallly/ui/form";
import { PlusIcon } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { Link } from "@/components/link";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import { Trans } from "@/i18n/client";

export type ConferencingOptions = {
  // Providers this instance offers, in menu order.
  available: ConferencingProvider[];
  // Providers the organizer has linked an account for.
  connected: ConferencingProvider[];
};

type ConferencingFormValues = {
  conferencingProvider?: ConferencingProvider | "";
};

// Picks the provider that will host the meeting. The link itself is created
// when the organizer finalizes the poll, so an unlinked account is caught here
// rather than at that later step.
export function ConferencingField({
  available,
  connected,
}: ConferencingOptions) {
  const form = useFormContext<ConferencingFormValues>();

  return (
    <Controller
      control={form.control}
      name="conferencingProvider"
      rules={{
        validate: (value) =>
          !value || connected.includes(value) ? true : "not_connected",
      }}
      render={({ field, fieldState }) => {
        if (!field.value) {
          return (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button type="button" className="rounded-full" />}
                >
                  <PlusIcon data-icon="inline-start" />
                  <Trans
                    i18nKey="addConferencing"
                    defaults="Add conferencing"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {available.map((provider) => (
                    <DropdownMenuItem
                      key={provider}
                      onClick={() => {
                        field.onChange(provider);
                        // Surface the missing connection right away instead of
                        // waiting for the submit attempt.
                        void form.trigger("conferencingProvider");
                      }}
                    >
                      <ConferencingProviderIcon provider={provider} size={16} />
                      {conferencingProviderLabels[provider]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }

        const label = conferencingProviderLabels[field.value];

        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                <Trans i18nKey="conferencing" defaults="Conferencing" />
              </FormLabel>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  field.onChange("");
                  form.clearErrors("conferencingProvider");
                }}
              >
                <Trans i18nKey="remove" defaults="Remove" />
              </Button>
            </div>
            <div className="flex h-9 items-center gap-x-2 rounded-md border bg-input-background px-3 text-sm">
              <ConferencingProviderIcon provider={field.value} size={16} />
              <span>{label}</span>
            </div>
            {fieldState.error ? (
              <p className="text-destructive text-sm" role="alert">
                <Trans
                  i18nKey="conferencingNotConnected"
                  defaults="Connect your {provider} account to add {provider} meetings to your polls. You can do this in <a>Settings → Conferencing</a>."
                  values={{ provider: label }}
                  components={{
                    a: (
                      <Link
                        href="/settings/conferencing"
                        className="underline hover:text-foreground"
                      />
                    ),
                  }}
                />
              </p>
            ) : null}
          </FormItem>
        );
      }}
    />
  );
}
