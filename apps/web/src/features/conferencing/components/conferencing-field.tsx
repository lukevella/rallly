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
import React from "react";
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

// The "add" affordance, kept apart from the field so the form can line it
// up with its sibling add buttons. Renders nothing once a provider is set.
export function AddConferencingButton({
  available,
}: Pick<ConferencingOptions, "available">) {
  const form = useFormContext<ConferencingFormValues>();
  const value = form.watch("conferencingProvider");

  if (value) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" className="rounded-full" />}
      >
        <PlusIcon data-icon="inline-start" />
        <Trans i18nKey="addConferencing" defaults="Add conferencing" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {available.map((provider) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => {
              form.setValue("conferencingProvider", provider, {
                shouldDirty: true,
              });
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

// Shows the chosen provider. The link itself is created when the organizer
// finalizes the poll, so an unlinked account is caught here rather than at
// that later step.
export function ConferencingField({
  connected,
}: Pick<ConferencingOptions, "connected">) {
  const form = useFormContext<ConferencingFormValues>();
  // `trigger` is stable; the context object itself is not (FormProvider
  // rebuilds it every render), so depending on `form` here would loop.
  const { trigger } = form;
  const value = form.watch("conferencingProvider");

  // Validate as soon as a provider is set — by the add button or by a draft
  // restored from storage — instead of waiting for the submit attempt. Runs
  // after mount so the Controller's rule is registered.
  React.useEffect(() => {
    if (value) {
      void trigger("conferencingProvider");
    }
  }, [value, trigger]);

  if (!value) {
    return null;
  }

  return (
    <Controller
      control={form.control}
      name="conferencingProvider"
      rules={{
        validate: (provider) =>
          !provider || connected.includes(provider) ? true : "not_connected",
      }}
      render={({ field, fieldState }) => {
        const provider = field.value as ConferencingProvider;
        const label = conferencingProviderLabels[provider];

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
              <ConferencingProviderIcon provider={provider} size={16} />
              <span>{label}</span>
            </div>
            {fieldState.error ? (
              <p className="text-destructive text-sm" role="alert">
                <Trans
                  i18nKey="conferencingNotConnected"
                  defaults="{provider} is not connected. Visit the <a>Conferencing settings</a> page to connect your account."
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
