"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import type React from "react";
import type { Control } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import { InputWithSaveButton } from "@/components/input-with-save-button";
import {
  getSpaceImageUploadUrlAction,
  removeSpaceImageAction,
  updateSpaceAction,
  updateSpaceImageAction,
} from "@/features/space/actions";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { spaceIconAssetProfile } from "@/features/space/constants";
import type { SpaceDTO } from "@/features/space/types";
import { Trans, useTranslation } from "@/i18n/client";

const spaceSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Space name is required")
    .max(100, "Space name must be less than 100 characters"),
});

type SpaceSettingsValues = z.infer<typeof spaceSettingsSchema>;

interface SpaceSettingsFormProps {
  space: SpaceDTO;
  disabled?: boolean;
}

export function SpaceSettingsForm({
  space,
  disabled = false,
}: SpaceSettingsFormProps) {
  const { t } = useTranslation();

  const updateSpace = useMutation(mutationOptions(updateSpaceAction));
  const getImageUploadUrl = useMutation(
    mutationOptions(getSpaceImageUploadUrlAction),
  );
  const updateImage = useMutation(mutationOptions(updateSpaceImageAction));
  const removeImage = useMutation(mutationOptions(removeSpaceImageAction));

  const form = useForm({
    resolver: zodResolver(spaceSettingsSchema),
    defaultValues: {
      name: space.name,
    },
  });

  return (
    <>
      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>
            <Trans i18nKey="logo" defaults="Logo" />
          </FieldTitle>
          <FieldDescription>
            <Trans
              i18nKey="spaceLogoSettingHint"
              defaults="The logo shown for this space."
            />
          </FieldDescription>
        </FieldContent>
        <ImageUpload>
          <ImageUploadPreview>
            <SpaceIcon name={space.name} src={space.image} size="xl" />
          </ImageUploadPreview>
          <ImageUploadControl
            profile={spaceIconAssetProfile}
            crop
            signUpload={(input) => getImageUploadUrl.mutateAsync(input)}
            persistUpload={(imageKey) => updateImage.mutateAsync({ imageKey })}
            onRemove={async () => {
              // A rejection inside ImageUpload's transition would reach the error boundary
              try {
                await removeImage.mutateAsync();
              } catch {}
            }}
            hasCurrentImage={!!space.image}
          />
        </ImageUpload>
      </Field>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="space-name">
            <Trans i18nKey="name" defaults="Name" />
          </FieldLabel>
          <FieldDescription>
            <Trans
              i18nKey="spaceNameSettingLabel"
              defaults="What this space is called."
            />
          </FieldDescription>
        </FieldContent>
        <SpaceNameField
          control={form.control}
          disabled={disabled}
          isSaving={updateSpace.isPending}
          isDirty={form.formState.isDirty}
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await updateSpace.mutateAsync({ name: data.name });
              form.reset(data);
              toast.success(
                t("spaceUpdatedSuccess", {
                  defaultValue: "Space updated successfully",
                }),
              );
            } catch {}
          })}
        />
      </Field>
    </>
  );
}

function SpaceNameField({
  control,
  disabled,
  isSaving,
  isDirty,
  onSubmit,
}: {
  control: Control<SpaceSettingsValues>;
  disabled: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <>
            <InputWithSaveButton
              {...field}
              id="space-name"
              disabled={disabled}
              placeholder={t("spaceNamePlaceholder", {
                defaultValue: "My Team",
              })}
              aria-invalid={fieldState.invalid}
              isDirty={isDirty}
              isSaving={isSaving}
            />
            {fieldState.invalid ? (
              <FieldError className="mt-1.5" errors={[fieldState.error]} />
            ) : null}
          </>
        )}
      />
    </form>
  );
}
