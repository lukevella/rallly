import { Button } from "@rallly/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MAX_POLL_DESCRIPTION_LENGTH } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useFormValidation } from "@/lib/utils/form-validation";

import { LazyRichTextEditor } from "./lazy-rich-text-editor";
import type { NewEventData } from "./types";

export const PollDetailsForm = () => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  const { requiredString } = useFormValidation();
  const { register } = form;

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
              placeholder={t("titlePlaceholder")}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormItem>
        <div>
          <FormLabel className="inline-block" htmlFor="location">
            {t("location")}
          </FormLabel>
          <span className="ml-1 text-muted-foreground text-sm">
            <Trans i18nKey="optionalLabel" defaults="(Optional)" />
          </span>
        </div>
        <Input
          type="text"
          id="location"
          className="w-full"
          placeholder={t("locationPlaceholder")}
          {...register("location")}
        />
      </FormItem>
      <DescriptionField />
    </div>
  );
};

const DescriptionField = () => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  // Reveal the editor whenever the field holds content — this covers values
  // restored asynchronously (persisted drafts, the edit form) that aren't yet
  // present on first render — or once the user opens it via the button. Remove
  // clears the value and resets `opened`, so it collapses again.
  const [opened, setOpened] = React.useState(false);
  const hasContent = !!form.watch("description")?.trim();
  const expanded = opened || hasContent;

  if (!expanded) {
    return (
      <div>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setOpened(true)}
        >
          <PlusIcon data-icon="inline-start" />
          <Trans i18nKey="addDescription" defaults="Add description" />
        </Button>
      </div>
    );
  }

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
          onClick={() => {
            form.setValue("description", "");
            setOpened(false);
          }}
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
