import { Button } from "@rallly/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";

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

  // Start expanded when a description already exists (e.g. the edit form);
  // otherwise the field is revealed on demand via the button below.
  const [expanded, setExpanded] = React.useState(
    () => !!form.getValues("description")?.trim(),
  );

  if (!expanded) {
    return (
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setExpanded(true)}
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
        <FormLabel htmlFor="description">{t("description")}</FormLabel>
        <button
          type="button"
          className="font-normal text-muted-foreground text-sm underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => {
            form.setValue("description", "");
            setExpanded(false);
          }}
        >
          <Trans i18nKey="remove" defaults="Remove" />
        </button>
      </div>
      <Controller
        control={form.control}
        name="description"
        render={({ field }) => (
          <LazyRichTextEditor
            id="description"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
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
        )}
      />
    </FormItem>
  );
};
