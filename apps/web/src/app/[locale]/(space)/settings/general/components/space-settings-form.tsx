"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError } from "@rallly/ui/field";
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
  SettingControl,
  SettingDescription,
  SettingRow,
  SettingTitle,
  useSettingLabels,
} from "@/components/setting";
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
      <SettingRow>
        <SettingTitle>
          <Trans i18nKey="logo" defaults="Logo" />
        </SettingTitle>
        <SettingDescription>
          <Trans
            i18nKey="spaceLogoSettingDescription"
            defaults="Shown next to your space name."
          />
        </SettingDescription>
        <SettingControl>
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
        </SettingControl>
      </SettingRow>
      <SettingRow>
        <SettingTitle>
          <Trans i18nKey="name" defaults="Name" />
        </SettingTitle>
        <SettingDescription>
          <Trans
            i18nKey="spaceNameSettingDescription"
            defaults="The name this space is known by."
          />
        </SettingDescription>
        <SettingControl>
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
        </SettingControl>
      </SettingRow>
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
  const labels = useSettingLabels();

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
                {...labels}
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
