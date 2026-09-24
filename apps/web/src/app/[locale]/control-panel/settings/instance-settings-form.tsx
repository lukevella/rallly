"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { ContainerIcon } from "lucide-react";
import React from "react";
import type { InstanceSettings } from "@/features/instance-settings/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { updateInstanceSettingsAction } from "./actions";

export function InstanceSettingsForm({
  defaultValue,
}: {
  defaultValue: InstanceSettings;
}) {
  const isRegistrationEnabled = useFeatureFlag("registration");
  const [disableUserRegistration, setDisableUserRegistration] = React.useState(
    !isRegistrationEnabled || Boolean(defaultValue.disableUserRegistration),
  );

  const updateInstanceSettings = useMutation(
    mutationOptions(updateInstanceSettingsAction),
  );
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    const disabled = value === "disabled";
    setDisableUserRegistration(disabled);
    toast.promise(
      updateInstanceSettings.mutateAsync({
        disableUserRegistration: disabled,
      }),
      {
        loading: t("saving", { defaultValue: "Saving..." }),
        success: t("saved", { defaultValue: "Saved" }),
      },
    );
  };

  return (
    <FieldGroup variant="divided">
      <Field>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="userRegistration">
              <Trans i18nKey="userRegistration" defaults="User registration" />
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="userRegistrationDescription"
                defaults="Allow new users to register an account."
              />
            </FieldDescription>
          </FieldContent>
          <Select
            items={{
              enabled: <Trans i18nKey="enabled" defaults="Enabled" />,
              disabled: <Trans i18nKey="disabled" defaults="Disabled" />,
            }}
            value={disableUserRegistration ? "disabled" : "enabled"}
            onValueChange={(value) => {
              if (value) {
                handleChange(value);
              }
            }}
            disabled={!isRegistrationEnabled}
          >
            <SelectTrigger id="userRegistration" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enabled">
                <Trans i18nKey="enabled" defaults="Enabled" />
              </SelectItem>
              <SelectItem value="disabled">
                <Trans i18nKey="disabled" defaults="Disabled" />
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {!isRegistrationEnabled && (
          <Alert variant="note">
            <ContainerIcon />
            <AlertDescription>
              <Trans
                i18nKey="configuredByEnvironmentVariable"
                defaults="This setting has been configured by environment variable."
              />
            </AlertDescription>
          </Alert>
        )}
      </Field>
    </FieldGroup>
  );
}
