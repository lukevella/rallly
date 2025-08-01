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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { updateSpaceAction } from "@/features/space/actions";
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
}

export function SpaceSettingsForm({ space }: SpaceSettingsFormProps) {
  const { t } = useTranslation();
  const updateSpace = useSafeAction(updateSpaceAction);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              updateSpace.status === "executing" || !form.formState.isDirty
            }
          >
            <Trans i18nKey="save" defaults="Save" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
