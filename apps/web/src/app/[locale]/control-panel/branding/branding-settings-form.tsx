"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import type { BrandingImageType } from "@/features/branding/schema";
import { hexColorSchema } from "@/features/branding/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { resolveStorageUrl } from "@/lib/storage/resolve-storage-url";
import {
  getBrandingImageUploadUrlAction,
  updateBrandingSettingsAction,
} from "./actions";

const brandingFormSchema = z.object({
  appName: z.string().min(1).max(100),
  primaryColor: hexColorSchema,
  primaryColorDark: z.union([hexColorSchema, z.literal("")]),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export type BrandingFormDefaultValue = {
  appName: string;
  primaryColor: string;
  primaryColorDark: string | null;
  logoUrl: string | null;
  logoUrlDark: string | null;
  logoIconUrl: string | null;
  hideAttribution: boolean;
};

export function BrandingSettingsForm({
  defaultValue,
  disabled = false,
}: {
  defaultValue: BrandingFormDefaultValue;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const updateBranding = useSafeAction(updateBrandingSettingsAction);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      appName: defaultValue.appName,
      primaryColor: defaultValue.primaryColor,
      primaryColorDark: defaultValue.primaryColorDark ?? "",
    },
  });

  const [hideAttribution, setHideAttribution] = React.useState(
    defaultValue.hideAttribution,
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await updateBranding.executeAsync({
      appName: values.appName,
      primaryColor: values.primaryColor,
      primaryColorDark: values.primaryColorDark || null,
    });

    if (!result?.serverError && !result?.validationErrors) {
      form.reset(values);
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  });

  const handleHideAttributionChange = (checked: boolean) => {
    setHideAttribution(checked);
    toast.promise(updateBranding.executeAsync({ hideAttribution: checked }), {
      loading: t("saving", { defaultValue: "Saving..." }),
      success: t("saved", { defaultValue: "Saved" }),
      error: t("unexpectedError", { defaultValue: "Unexpected error" }),
    });
  };

  return (
    <PageSectionGroup>
      <form onSubmit={handleSubmit}>
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="general" defaults="General" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="brandingGeneralDescription"
                  defaults="The name shown in page titles, navigation and emails"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <FieldGroup variant="divided">
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldLabel htmlFor="app-name">
                      <Trans i18nKey="appName" defaults="App name" />
                    </FieldLabel>
                  </FieldContent>
                  <Controller
                    control={form.control}
                    name="appName"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          {...field}
                          id="app-name"
                          className="w-56"
                          disabled={disabled}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? (
                          <FieldError
                            className="mt-1.5"
                            errors={[fieldState.error]}
                          />
                        ) : null}
                      </div>
                    )}
                  />
                </Field>
              </FieldGroup>
            </PageSectionContent>
          </PageSection>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="colors" defaults="Colors" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="colorsDescription"
                  defaults="Primary colors used for theming"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <FieldGroup variant="divided">
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle>
                      <Trans i18nKey="primaryColor" defaults="Primary color" />
                    </FieldTitle>
                  </FieldContent>
                  <Controller
                    control={form.control}
                    name="primaryColor"
                    render={({ field, fieldState }) => (
                      <ColorField
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        error={fieldState.error}
                      />
                    )}
                  />
                </Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle>
                      <Trans
                        i18nKey="primaryColorDark"
                        defaults="Primary color (dark mode)"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <Controller
                    control={form.control}
                    name="primaryColorDark"
                    render={({ field, fieldState }) => (
                      <ColorField
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        placeholder={defaultValue.primaryColor}
                        error={fieldState.error}
                      />
                    )}
                  />
                </Field>
              </FieldGroup>
            </PageSectionContent>
          </PageSection>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={updateBranding.isExecuting}
              disabled={disabled || !form.formState.isDirty}
            >
              <Trans i18nKey="save" defaults="Save" />
            </Button>
          </div>
        </PageSectionGroup>
      </form>
      <PageSection variant="card">
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="logos" defaults="Logos" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="logosDescription"
              defaults="Logo images used throughout the application"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <FieldGroup variant="divided">
            <LogoField
              type="logo"
              field="logoUrl"
              label={<Trans i18nKey="logo" defaults="Logo" />}
              currentValue={defaultValue.logoUrl}
              disabled={disabled}
            />
            <LogoField
              type="logo-dark"
              field="logoUrlDark"
              label={<Trans i18nKey="logoDark" defaults="Logo (dark mode)" />}
              currentValue={defaultValue.logoUrlDark}
              background="dark"
              disabled={disabled}
            />
            <LogoField
              type="logo-icon"
              field="logoIconUrl"
              label={<Trans i18nKey="logoIcon" defaults="Logo icon" />}
              currentValue={defaultValue.logoIconUrl}
              aspect={1}
              disabled={disabled}
            />
          </FieldGroup>
        </PageSectionContent>
      </PageSection>
      <PageSection variant="card">
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="attribution" defaults="Attribution" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="attributionDescription"
              defaults="Control the visibility of the attribution text"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <FieldGroup variant="divided">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="hide-attribution">
                  <Trans
                    i18nKey="hideAttribution"
                    defaults="Hide attribution"
                  />
                </FieldLabel>
              </FieldContent>
              <Switch
                id="hide-attribution"
                checked={hideAttribution}
                disabled={disabled}
                onCheckedChange={handleHideAttributionChange}
              />
            </Field>
          </FieldGroup>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}

function ColorField({
  value,
  onChange,
  disabled,
  placeholder,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: { message?: string };
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-hidden
          tabIndex={-1}
          className="size-8 shrink-0 cursor-pointer rounded border bg-transparent disabled:cursor-default"
          value={value || placeholder || "#000000"}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          className="w-32 font-mono"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? <FieldError className="mt-1.5" errors={[error]} /> : null}
    </div>
  );
}

function LogoField({
  type,
  field,
  label,
  currentValue,
  background = "light",
  aspect,
  disabled,
}: {
  type: BrandingImageType;
  field: "logoUrl" | "logoUrlDark" | "logoIconUrl";
  label: React.ReactNode;
  currentValue: string | null;
  background?: "light" | "dark";
  aspect?: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const updateBranding = useSafeAction(updateBrandingSettingsAction);
  const [value, setValue] = React.useState<string | null>(currentValue);

  const handleGetUploadUrl = async (input: {
    fileType: "image/jpeg" | "image/png";
    fileSize: number;
  }) => {
    const result = await getBrandingImageUploadUrlAction({ type, ...input });
    if (!result?.data) {
      throw new Error("Failed to get upload URL");
    }
    return result.data;
  };

  const persist = async (nextValue: string | null) => {
    setValue(nextValue);
    await updateBranding.executeAsync({ [field]: nextValue });
  };

  return (
    <Field orientation="responsive">
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
      </FieldContent>
      <ImageUpload>
        <ImageUploadPreview>
          <div
            className={
              background === "dark"
                ? "flex h-16 w-40 items-center justify-center overflow-hidden rounded border bg-gray-900"
                : "flex h-16 w-40 items-center justify-center overflow-hidden rounded border bg-white"
            }
          >
            {value ? (
              // biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image
              <img
                src={resolveStorageUrl(value)}
                alt={t("logo", { defaultValue: "Logo" })}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : null}
          </div>
        </ImageUploadPreview>
        <ImageUploadControl
          getUploadUrl={handleGetUploadUrl}
          onUploadSuccess={(key) => persist(key)}
          onRemoveSuccess={() => persist(null)}
          hasCurrentImage={!!value}
          aspect={aspect}
          disabled={disabled}
        />
      </ImageUpload>
    </Field>
  );
}
