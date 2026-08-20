"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import { FieldError, FieldLabel } from "@rallly/ui/field";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import type { FooterLink } from "@/features/instance-settings/schema";
import {
  FOOTER_LINK_MAX_COUNT,
  FOOTER_LINK_MAX_HREF_LENGTH,
  FOOTER_LINK_MAX_LABEL_LENGTH,
  isValidFooterLinkHref,
} from "@/features/instance-settings/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { updateFooterLinksAction } from "./actions";

export function FooterLinksField({
  defaultValue,
}: {
  defaultValue: FooterLink[];
}) {
  const { t } = useTranslation();
  const updateFooterLinks = useSafeAction(updateFooterLinksAction);

  // Mirrors footerLinksSchema, with the href message translated. The server
  // action still validates against the un-localised schema.
  const formSchema = z.object({
    footerLinks: z
      .array(
        z.object({
          label: z
            .string()
            .trim()
            .min(1, t("requiredField", { defaultValue: "Required" }))
            .max(FOOTER_LINK_MAX_LABEL_LENGTH),
          href: z
            .string()
            .trim()
            .min(1, t("requiredField", { defaultValue: "Required" }))
            .max(FOOTER_LINK_MAX_HREF_LENGTH)
            .refine(isValidFooterLinkHref, {
              message: t("footerLinkUrlInvalid", {
                defaultValue: "Enter a URL starting with http:// or https://",
              }),
            }),
        }),
      )
      .max(FOOTER_LINK_MAX_COUNT),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      footerLinks: defaultValue,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "footerLinks",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (data) => {
        const result = await updateFooterLinks.executeAsync(data);

        if (!result?.serverError && !result?.validationErrors) {
          form.reset(data);
          toast.success(t("saved", { defaultValue: "Saved" }));
        }
      })}
    >
      {fields.length > 0 ? (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
            >
              <Controller
                control={form.control}
                name={`footerLinks.${index}.label`}
                render={({ field: labelField, fieldState }) => (
                  <div className="sm:w-56">
                    <FieldLabel className="sr-only" htmlFor={labelField.name}>
                      <Trans i18nKey="footerLinkLabel" defaults="Label" />
                    </FieldLabel>
                    <Input
                      {...labelField}
                      id={labelField.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t("footerLinkLabelPlaceholder", {
                        defaultValue: "Privacy policy",
                      })}
                    />
                    {fieldState.invalid ? (
                      <FieldError
                        className="mt-1.5"
                        errors={[fieldState.error]}
                      />
                    ) : null}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name={`footerLinks.${index}.href`}
                render={({ field: hrefField, fieldState }) => (
                  <div className="flex-1">
                    <FieldLabel className="sr-only" htmlFor={hrefField.name}>
                      <Trans i18nKey="footerLinkUrl" defaults="URL" />
                    </FieldLabel>
                    <Input
                      {...hrefField}
                      id={hrefField.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="https://example.com/privacy"
                    />
                    {fieldState.invalid ? (
                      <FieldError
                        className="mt-1.5"
                        errors={[fieldState.error]}
                      />
                    ) : null}
                  </div>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label={t("footerLinkRemove", {
                  defaultValue: "Remove link",
                })}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={fields.length >= FOOTER_LINK_MAX_COUNT}
          onClick={() => append({ label: "", href: "" })}
        >
          <PlusIcon className="size-4" />
          <Trans i18nKey="footerLinkAdd" defaults="Add link" />
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={updateFooterLinks.isExecuting}
          disabled={!form.formState.isDirty}
        >
          <Trans i18nKey="save" defaults="Save" />
        </Button>
      </div>
    </form>
  );
}
