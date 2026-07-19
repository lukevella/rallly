"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@rallly/ui/field";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import {
  getSpaceImageUploadUrlAction,
  removeSpaceImageAction,
  updateSpaceAction,
  updateSpaceImageAction,
} from "@/features/space/actions";
import { SpaceIcon } from "@/features/space/components/space-icon";
import type { SpaceDTO } from "@/features/space/types";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const spaceSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Space name is required")
    .max(100, "Space name must be less than 100 characters"),
});

interface SpaceSettingsFormProps {
  space: SpaceDTO;
  disabled?: boolean;
}

export function SpaceSettingsForm({
  space,
  disabled = false,
}: SpaceSettingsFormProps) {
  const { t } = useTranslation();

  const updateSpace = useSafeAction(updateSpaceAction);
  const updateImage = useSafeAction(updateSpaceImageAction);
  const removeImage = useSafeAction(removeSpaceImageAction);

  const form = useForm({
    resolver: zodResolver(spaceSettingsSchema),
    defaultValues: {
      name: space.name,
    },
  });

  const handleGetUploadUrl = async (input: {
    fileType: "image/jpeg" | "image/png";
    fileSize: number;
  }) => {
    const result = await getSpaceImageUploadUrlAction(input);

    if (!result?.data) {
      throw new Error("Failed to get upload URL");
    }

    return result.data;
  };

  const handleImageUploadSuccess = async (imageKey: string) => {
    await updateImage.executeAsync({ imageKey });
  };

  const handleImageRemoveSuccess = async () => {
    await removeImage.executeAsync();
  };

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        const result = await updateSpace.executeAsync({ name: data.name });

        if (!result?.serverError && !result?.validationErrors) {
          form.reset(data);
          toast.success(
            t("spaceUpdatedSuccess", {
              defaultValue: "Space updated successfully",
            }),
          );
        }
      })}
    >
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>
                <Trans i18nKey="logo" defaults="Logo" />
              </FieldLabel>
              <ImageUpload>
                <ImageUploadPreview>
                  <SpaceIcon name={space.name} src={space.image} size="xl" />
                </ImageUploadPreview>
                <ImageUploadControl
                  getUploadUrl={handleGetUploadUrl}
                  onUploadSuccess={handleImageUploadSuccess}
                  onRemoveSuccess={handleImageRemoveSuccess}
                  hasCurrentImage={!!space.image}
                />
              </ImageUpload>
            </Field>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    <Trans i18nKey="name" defaults="Name" />
                  </FieldLabel>
                  <Input
                    {...field}
                    disabled={disabled}
                    className="w-48"
                    placeholder={t("spaceNamePlaceholder", {
                      defaultValue: "My Team",
                    })}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
        <Field orientation="horizontal">
          <Button
            type="submit"
            disabled={
              disabled || updateSpace.isExecuting || !form.formState.isDirty
            }
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
