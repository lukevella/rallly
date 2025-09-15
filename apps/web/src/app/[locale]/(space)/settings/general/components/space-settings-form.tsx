"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
import { Trans } from "@/components/trans";
import {
  removeSpaceImageAction,
  updateSpaceAction,
  updateSpaceImageAction,
} from "@/features/space/actions";
import { SpaceIcon } from "@/features/space/components/space-icon";
import type { SpaceDTO } from "@/features/space/types";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const spaceSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Space name is required")
    .max(100, "Space name must be less than 100 characters"),
});

type SpaceSettingsData = z.infer<typeof spaceSettingsSchema>;

interface SpaceSettingsFormProps {
  space: SpaceDTO;
  disabled?: boolean;
}

export function SpaceSettingsForm({
  space,
  disabled = false,
}: SpaceSettingsFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const updateSpace = useSafeAction(updateSpaceAction);
  const updateImage = useSafeAction(updateSpaceImageAction);
  const removeImage = useSafeAction(removeSpaceImageAction);

  const form = useForm<SpaceSettingsData>({
    resolver: zodResolver(spaceSettingsSchema),
    defaultValues: {
      name: space.name,
    },
  });

  const onSubmit = async (data: SpaceSettingsData) => {
    toast.promise(
      updateSpace.executeAsync({
        name: data.name,
      }),
      {
        loading: t("updatingSpace", { defaultValue: "Updating space..." }),
        success: t("spaceUpdatedSuccess", {
          defaultValue: "Space updated successfully",
        }),
        error: t("spaceUpdatedError", {
          defaultValue: "Failed to update space",
        }),
      },
    );

    form.reset(data);
  };

  const handleImageUploadSuccess = async (imageKey: string) => {
    await updateImage.executeAsync({ imageKey });
    router.refresh();
  };

  const handleImageRemoveSuccess = async () => {
    await removeImage.executeAsync();
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <FormLabel>
            <Trans i18nKey="image" defaults="Image" />
          </FormLabel>
          <ImageUpload className="mt-2">
            <ImageUploadPreview>
              <SpaceIcon name={space.name} src={space.image} size="xl" />
            </ImageUploadPreview>
            <ImageUploadControl
              keyPrefix="spaces"
              onUploadSuccess={handleImageUploadSuccess}
              onRemoveSuccess={handleImageRemoveSuccess}
              hasCurrentImage={!!space.image}
            />
          </ImageUpload>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="name" defaults="Name" />
              </FormLabel>
              <FormControl>
                <Input
                  className="w-72"
                  placeholder={t("spaceNamePlaceholder", {
                    defaultValue: "My Team",
                  })}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Button
            type="submit"
            disabled={
              disabled ||
              updateSpace.status === "executing" ||
              !form.formState.isDirty
            }
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
