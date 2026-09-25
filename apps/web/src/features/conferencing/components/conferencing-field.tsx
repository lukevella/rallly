"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@rallly/ui/dropdown-menu";
import { FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { VideoIcon } from "lucide-react";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Link } from "@/components/link";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import { Trans, useTranslation } from "@/i18n/client";

export type ConferencingOptions = {
  // Providers this instance offers, in menu order. A pasted link is always
  // offered and needs no provider.
  available: ConferencingProvider[];
  // Providers the organizer has linked an account for.
  connected: ConferencingProvider[];
};

type ConferencingFormValues = {
  conferencingProvider?: ConferencingProvider | "custom" | "";
  conferencingUrl?: string;
  conferencingLabel?: string;
};

// Menu entries for the shared "Add location" menu. Renders nothing once a
// choice is made: an event carries one meeting link.
export function ConferencingProviderMenuItems({
  available,
}: Pick<ConferencingOptions, "available">) {
  const form = useFormContext<ConferencingFormValues>();
  const value = form.watch("conferencingProvider");

  if (value) {
    return null;
  }

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>
        <Trans i18nKey="videoCall" defaults="Video call" />
      </DropdownMenuLabel>
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
      <DropdownMenuItem
        onClick={() => {
          form.setValue("conferencingProvider", "custom", {
            shouldDirty: true,
          });
        }}
      >
        <VideoIcon />
        <Trans i18nKey="customVideoCall" defaults="Custom" />
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

// Shows the chosen provider, or the inputs for a pasted link. A provider
// link is created when the organizer finalizes the poll, so an unlinked
// account is caught here rather than at that later step.
export function ConferencingField({
  connected,
}: Pick<ConferencingOptions, "connected">) {
  const { t } = useTranslation();
  const form = useFormContext<ConferencingFormValues>();
  // `trigger` is stable; the context object itself is not (FormProvider
  // rebuilds it every render), so depending on `form` here would loop.
  const { trigger } = form;
  const value = form.watch("conferencingProvider");

  // Validate as soon as a provider is set — by the menu or by a draft
  // restored from storage — instead of waiting for the submit attempt. Runs
  // after mount so the Controller's rule is registered.
  React.useEffect(() => {
    if (value && value !== "custom") {
      void trigger("conferencingProvider");
    }
  }, [value, trigger]);

  if (!value) {
    return null;
  }

  const remove = () => {
    form.setValue("conferencingProvider", "");
    form.setValue("conferencingUrl", "");
    form.setValue("conferencingLabel", "");
    form.clearErrors([
      "conferencingProvider",
      "conferencingLabel",
      "conferencingUrl",
    ]);
  };

  const header = (
    <div className="flex items-center justify-between">
      <FormLabel
        htmlFor={value === "custom" ? "conferencing-label" : undefined}
      >
        <Trans i18nKey="videoCall" defaults="Video call" />
      </FormLabel>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-muted-foreground hover:text-foreground"
        onClick={remove}
      >
        <Trans i18nKey="remove" defaults="Remove" />
      </Button>
    </div>
  );

  if (value === "custom") {
    return (
      <FormItem>
        {header}
        <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
          <Controller
            control={form.control}
            name="conferencingLabel"
            rules={{
              validate: (label) =>
                label?.trim()
                  ? true
                  : t("customVideoCallNameRequired", {
                      defaultValue: "Name the call, like Microsoft Teams.",
                    }),
            }}
            render={({ field, fieldState }) => (
              <div className="grid gap-2">
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="conferencing-label"
                  type="text"
                  maxLength={100}
                  placeholder={t("customVideoCallNamePlaceholder", {
                    defaultValue: "Microsoft Teams",
                  })}
                  aria-invalid={fieldState.error ? true : undefined}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-sm" role="alert">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="conferencingUrl"
            rules={{
              validate: (url) => {
                if (!url?.trim()) {
                  return true;
                }
                try {
                  const { protocol } = new URL(url.trim());
                  if (protocol !== "https:" && protocol !== "http:") {
                    throw new Error();
                  }
                  return true;
                } catch {
                  return t("customLinkInvalid", {
                    defaultValue: "That doesn't look like a link.",
                  });
                }
              },
            }}
            render={({ field, fieldState }) => (
              <div className="grid gap-2">
                {/* Not type="url": the browser's own constraint check would
                    block submit before react-hook-form's rule runs, so the
                    organizer would see no message. */}
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="conferencing-url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  aria-label={t("customLinkOptional", {
                    defaultValue: "Link (optional)",
                  })}
                  placeholder={t("customLinkOptional", {
                    defaultValue: "Link (optional)",
                  })}
                  aria-invalid={fieldState.error ? true : undefined}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-sm" role="alert">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>
      </FormItem>
    );
  }

  return (
    <Controller
      control={form.control}
      name="conferencingProvider"
      rules={{
        validate: (provider) =>
          !provider || provider === "custom" || connected.includes(provider)
            ? true
            : "not_connected",
      }}
      render={({ field, fieldState }) => {
        const provider = field.value as ConferencingProvider;
        const label = conferencingProviderLabels[provider];

        return (
          <FormItem>
            {header}
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
