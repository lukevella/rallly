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
import { Controller, useForm } from "react-hook-form";
import { brandingSettingsSchema } from "@/features/instance-settings/schema";
import { Trans, useTranslation } from "@/i18n/client";
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
            <InputGroup className="w-56">
              <InputGroupInput
                {...field}
                id="app-name"
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              {/* Rendered only when there is something to save. A disabled
                  button here would trip InputGroup's `has-disabled:` styles
                  and grey out the whole field. */}
              {form.formState.isDirty && !disabled ? (
                <InputGroupAddon align="inline-end">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <InputGroupButton
                          type="submit"
                          size="icon-xs"
                          loading={updateBranding.isExecuting}
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
