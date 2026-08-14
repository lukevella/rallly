"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError } from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { Controller, useForm } from "react-hook-form";
import { InputWithSaveButton } from "@/components/input-with-save-button";
import { brandingSettingsSchema } from "@/features/instance-settings/schema";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
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
  const updateBranding = useSafeAction(updateBrandingSettingsAction);

  const form = useForm({
    resolver: zodResolver(appNameSchema),
    defaultValues: {
      appName: defaultValue,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        const result = await updateBranding.executeAsync(data);

        if (!result?.serverError && !result?.validationErrors) {
          form.reset(data);
          toast.success(t("saved", { defaultValue: "Saved" }));
        }
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
              isSaving={updateBranding.isExecuting}
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
