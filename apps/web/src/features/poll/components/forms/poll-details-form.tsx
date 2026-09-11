import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { FormField, FormItem, FormLabel, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { MapPinIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { ConferencingOptions } from "@/features/conferencing/components/conferencing-field";
import {
  ConferencingField,
  ConferencingProviderMenuItems,
} from "@/features/conferencing/components/conferencing-field";
import { MAX_POLL_DESCRIPTION_LENGTH } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useFormValidation } from "@/lib/utils/form-validation";

import { LazyRichTextEditor } from "./lazy-rich-text-editor";
import type { NewEventData } from "./types";

// `conferencing` is absent when the instance offers no provider or the
// organizer is a guest; "Add location" then opens the address field directly.
export const PollDetailsForm = ({
  conferencing,
}: {
  conferencing?: ConferencingOptions | null;
}) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  const { requiredString } = useFormValidation();
  const { register } = form;

  // Optional fields reveal themselves whenever they hold content — covering
  // values restored asynchronously (persisted drafts, the edit form) — or once
  // the user opens them. Remove clears the value and resets `opened`, so the
  // field collapses again.
  const [locationOpened, setLocationOpened] = React.useState(false);
  const hasLocation = !!form.watch("location")?.trim();
  const locationExpanded = locationOpened || hasLocation;

  const [descriptionOpened, setDescriptionOpened] = React.useState(false);
  const hasDescription = !!form.watch("description")?.trim();
  const descriptionExpanded = descriptionOpened || hasDescription;

  const canAddAddress = !locationExpanded;
  const canAddVideoCall = !!conferencing && !form.watch("conferencingProvider");

  return (
    <div className="grid gap-4 py-1">
      <FormField
        control={form.control}
        name="title"
        rules={{
          validate: requiredString(t("title")),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="title">{t("title")}</FormLabel>
            <Input
              {...field}
              type="text"
              id="title"
              className="w-full"
              placeholder={t("titlePlaceholder", {
                defaultValue: "Monthly Meetup",
              })}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      {locationExpanded ? (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="location">{t("location")}</FormLabel>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                form.setValue("location", "");
                setLocationOpened(false);
              }}
            >
              <Trans i18nKey="remove" defaults="Remove" />
            </Button>
          </div>
          <Input
            type="text"
            id="location"
            className="w-full"
            placeholder={t("locationPlaceholder")}
            {...register("location")}
          />
        </FormItem>
      ) : null}
      {conferencing ? (
        <ConferencingField connected={conferencing.connected} />
      ) : null}
      {descriptionExpanded ? (
        <DescriptionField
          onRemove={() => {
            form.setValue("description", "");
            setDescriptionOpened(false);
          }}
        />
      ) : null}
      {canAddAddress || canAddVideoCall || !descriptionExpanded ? (
        <div className="flex flex-wrap gap-2">
          {canAddVideoCall ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" className="rounded-full" />}
              >
                <PlusIcon data-icon="inline-start" />
                <Trans i18nKey="addLocation" defaults="Add location" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {canAddAddress ? (
                  <DropdownMenuItem onClick={() => setLocationOpened(true)}>
                    <MapPinIcon />
                    <Trans i18nKey="address" defaults="Address" />
                  </DropdownMenuItem>
                ) : null}
                <ConferencingProviderMenuItems
                  available={conferencing.available}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : canAddAddress ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setLocationOpened(true)}
            >
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="addLocation" defaults="Add location" />
            </Button>
          ) : null}
          {!descriptionExpanded ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setDescriptionOpened(true)}
            >
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="addDescription" defaults="Add description" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const DescriptionField = ({ onRemove }: { onRemove: () => void }) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  return (
    <FormItem>
      <div className="flex items-center justify-between">
        <FormLabel id="description-label" htmlFor="description">
          {t("description")}
        </FormLabel>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={onRemove}
        >
          <Trans i18nKey="remove" defaults="Remove" />
        </Button>
      </div>
      <Controller
        control={form.control}
        name="description"
        rules={{
          maxLength: {
            value: MAX_POLL_DESCRIPTION_LENGTH,
            message: t("descriptionTooLong", {
              defaultValue: "Description must be at most {count} characters",
              count: MAX_POLL_DESCRIPTION_LENGTH,
            }),
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <LazyRichTextEditor
              id="description"
              aria-labelledby="description-label"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={MAX_POLL_DESCRIPTION_LENGTH}
              placeholder={t("descriptionPlaceholder")}
              labels={{
                bold: t("richTextBold", { defaultValue: "Bold" }),
                italic: t("richTextItalic", { defaultValue: "Italic" }),
                link: t("richTextLink", { defaultValue: "Link" }),
                bulletList: t("richTextBulletList", {
                  defaultValue: "Bullet list",
                }),
                numberedList: t("richTextNumberedList", {
                  defaultValue: "Numbered list",
                }),
                linkPlaceholder: t("richTextLinkPlaceholder", {
                  defaultValue: "Paste or type a link",
                }),
                linkApply: t("richTextLinkApply", { defaultValue: "Apply" }),
                linkRemove: t("richTextLinkRemove", {
                  defaultValue: "Remove link",
                }),
                linkVisit: t("richTextLinkVisit", {
                  defaultValue: "Open link in new tab",
                }),
                charactersRemaining: (count) =>
                  t("charactersRemaining", {
                    defaultValue:
                      "{count, plural, one {# character remaining} other {# characters remaining}}",
                    count,
                  }),
              }}
            />
            {fieldState.error ? (
              <p className="text-destructive text-sm">
                {fieldState.error.message}
              </p>
            ) : null}
          </>
        )}
      />
    </FormItem>
  );
};
