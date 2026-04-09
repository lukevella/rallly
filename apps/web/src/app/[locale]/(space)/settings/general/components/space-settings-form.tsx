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
import { SpaceIcon } from "@/features/space/components/space-icon";
import type { SpaceDTO } from "@/features/space/types";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

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

  const updateSpace = trpc.spaces.update.useMutation();
  const getImageUploadUrl = trpc.spaces.getImageUploadUrl.useMutation();
  const updateImage = trpc.spaces.updateImage.useMutation();
  const removeImage = trpc.spaces.removeImage.useMutation();

  const form = useForm({
    resolver: zodResolver(spaceSettingsSchema),
    defaultValues: {
      name: space.name,
    },
  });

  const handleImageUploadSuccess = async (imageKey: string) => {
    await updateImage.mutateAsync({ imageKey });
  };

  const handleImageRemoveSuccess = async () => {
    await removeImage.mutateAsync();
  };

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        toast.promise(
          updateSpace
            .mutateAsync({
              name: data.name,
            })
            .then(() => {
              form.reset(data);
            }),
          {
            loading: t("updatingSpace", {
              defaultValue: "Updating space...",
            }),
            success: t("spaceUpdatedSuccess", {
              defaultValue: "Space updated successfully",
            }),
            error: t("spaceUpdatedError", {
              defaultValue: "Failed to update space",
            }),
          },
        );
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
                  getUploadUrl={(input) => getImageUploadUrl.mutateAsync(input)}
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
              disabled || updateSpace.isPending || !form.formState.isDirty
            }
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
