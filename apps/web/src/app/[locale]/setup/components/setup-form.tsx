"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import { ButtonGroup, ButtonGroupItem } from "@rallly/ui/button-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { BriefcaseIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { setupSpaceAction } from "@/app/[locale]/setup/actions";
import { TimeZoneSelect } from "@/components/time-zone-picker/time-zone-select";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import type { TimeFormat } from "@/lib/datetime/types";
import { useSafeAction } from "@/lib/safe-action/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

function useSetupFormSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z
      .object({
        name: z.string().min(1).max(100),
        timeZone: z.string().min(1),
        timeFormat: z.enum(["hours12", "hours24"]),
        spaceType: z.enum(["personal", "work"]),
        organizationName: z.string().max(100),
      })
      .refine(
        (data) =>
          data.spaceType === "personal" ||
          data.organizationName.trim().length > 0,
        {
          path: ["organizationName"],
          message: t("organizationNameRequired", {
            defaultValue: "Organization name is required",
          }),
        },
      );
  }, [t]);
}

function SpaceTypeOption({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className="group flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-colors hover:bg-accent has-data-checked:border-primary has-data-checked:bg-primary/5"
    >
      <span className="text-muted-foreground group-has-data-checked:text-primary">
        {icon}
      </span>
      <span className="flex-1 font-normal">{label}</span>
      <RadioGroupItem className="hidden" id={id} value={value} />
    </label>
  );
}

export function SetupForm({
  defaultName,
  defaultTimeZone,
  defaultTimeFormat,
}: {
  defaultName: string;
  defaultTimeZone?: string;
  defaultTimeFormat?: TimeFormat;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const schema = useSetupFormSchema();
  const setupSpace = useSafeAction(setupSpaceAction);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      timeZone: defaultTimeZone || getBrowserTimeZone(),
      timeFormat:
        defaultTimeFormat ?? getLocaleDefaults(i18n.language).timeFormat,
      spaceType: "personal" as const,
      organizationName: "",
    },
  });

  const spaceType = form.watch("spaceType");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          async ({
            name,
            timeZone,
            timeFormat,
            spaceType,
            organizationName,
          }) => {
            const res = await authClient.updateUser({
              name,
              timeZone,
              timeFormat,
              locale: i18n.language,
            });

            if (res.error) {
              form.setError("root", {
                message: res.error.message,
              });
              return;
            }

            const result = await setupSpace.executeAsync(
              spaceType === "work"
                ? { spaceType, organizationName: organizationName.trim() }
                : { spaceType },
            );

            // Server errors surface through the global useSafeAction toast;
            // stay on the form so the user can retry. On success the hook
            // refreshes the router and the page redirects onward.
            if (result?.serverError || result?.validationErrors) {
              return;
            }

            router.refresh();
          },
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="name" defaults="Name" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="name"
                  data-1p-ignore
                  placeholder={t("namePlaceholder", {
                    defaultValue: "Jessie Smith",
                  })}
                  disabled={form.formState.isSubmitting}
                  autoFocus={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="timeZone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="timeZone" defaults="Time zone" />
                </FormLabel>
                <FormControl>
                  <TimeZoneSelect
                    // The combobox input group is h-8 by default; match the
                    // h-9 controls in the rest of the form
                    className="min-w-0 [&_[data-slot=input-group]]:h-9"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="timeFormat" defaults="Time format" />
                </FormLabel>
                <FormControl>
                  <ButtonGroup
                    className="w-full"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  >
                    <ButtonGroupItem value="hours12">
                      <Trans i18nKey="12h" defaults="12-hour" />
                    </ButtonGroupItem>
                    <ButtonGroupItem value="hours24">
                      <Trans i18nKey="24h" defaults="24-hour" />
                    </ButtonGroupItem>
                  </ButtonGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="spaceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans
                  i18nKey="spaceTypeLabel"
                  defaults="What will you be using it for?"
                />
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.clearErrors("organizationName");
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  <SpaceTypeOption
                    value="personal"
                    icon={<UserIcon className="size-4" />}
                    label={t("spaceTypePersonal", {
                      defaultValue: "Personal",
                    })}
                  />
                  <SpaceTypeOption
                    value="work"
                    icon={<BriefcaseIcon className="size-4" />}
                    label={t("spaceTypeWork", { defaultValue: "Work" })}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {spaceType === "work" ? (
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans
                    i18nKey="organizationName"
                    defaults="Organization Name"
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-1p-ignore
                    autoFocus={true}
                    placeholder={t("organizationNamePlaceholder", {
                      defaultValue: "e.g. Acme Corp",
                    })}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {form.formState.errors.root?.message ? (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        ) : null}
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={
              form.formState.isSubmitting || form.formState.isSubmitSuccessful
            }
            className="w-full"
          >
            <Trans i18nKey="continue" defaults="Continue" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
