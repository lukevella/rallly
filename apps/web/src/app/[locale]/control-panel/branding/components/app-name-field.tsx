"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { FieldError } from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { InputWithSaveButton } from "@/components/input-with-save-button";
import { brandingSettingsSchema } from "@/features/instance-settings/schema";
import { useTranslation } from "@/i18n/client";
import { updateBrandingSettingsAction } from "../actions";

const appNameSchema = brandingSettingsSchema.pick({ appName: true });

export function AppNameField({
  defaultValue,
  disabled = false,
}: {
  defaultValue: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(appNameSchema),
    defaultValues: {
      appName: defaultValue,
    },
  });

  const updateBranding = useMutation(
    mutationOptions(updateBrandingSettingsAction, {
      onSuccess: (_data, input) => {
        form.reset(input);
        toast.success(t("saved", { defaultValue: "Saved" }));
      },
    }),
  );

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        updateBranding.mutate(data);
      })}
    >
      <Controller
        control={form.control}
        name="appName"
        render={({ field, fieldState }) => (
          <>
            <InputWithSaveButton
              {...field}
              id="app-name"
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              isDirty={form.formState.isDirty}
              isSaving={updateBranding.isPending}
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
