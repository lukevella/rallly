"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon } from "lucide-react";
import type React from "react";
import type { Control } from "react-hook-form";
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
    <>
      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>
            <Trans i18nKey="logo" defaults="Logo" />
          </FieldTitle>
          <FieldDescription>
            <Trans
              i18nKey="spaceLogoSettingHint"
              defaults="Your space's logo."
            />
          </FieldDescription>
        </FieldContent>
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
          isSaving={updateSpace.isExecuting}
          isDirty={form.formState.isDirty}
          onSubmit={form.handleSubmit(async (data) => {
            const result = await updateSpace.executeAsync({
              name: data.name,
            });

            if (!result?.serverError && !result?.validationErrors) {
              form.reset(data);
              toast.success(
                t("spaceUpdatedSuccess", {
                  defaultValue: "Space updated successfully",
                }),
              );
            }
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
            <InputGroup className="w-56">
              <InputGroupInput
                {...field}
                id="space-name"
                disabled={disabled}
                placeholder={t("spaceNamePlaceholder", {
                  defaultValue: "My Team",
                })}
                aria-invalid={fieldState.invalid}
              />
              {/* Rendered only when there is something to save. A disabled
                  button here would trip InputGroup's `has-disabled:` styles
                  and grey out the whole field. */}
              {isDirty && !disabled ? (
                <InputGroupAddon align="inline-end">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <InputGroupButton
                          type="submit"
                          size="icon-xs"
                          loading={isSaving}
                          aria-label={t("save", { defaultValue: "Save" })}
                        >
                          <CheckIcon />
                        </InputGroupButton>
                      }
                    />
                    <TooltipContent>
                      <Trans i18nKey="save" defaults="Save" />
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            {fieldState.invalid ? (
              <FieldError className="mt-1.5" errors={[fieldState.error]} />
            ) : null}
          </>
        )}
      />
    </form>
  );
}
