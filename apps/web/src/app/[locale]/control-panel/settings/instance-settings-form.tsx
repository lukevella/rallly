"use client";

import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Label } from "@rallly/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import { ContainerIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/components/trans";
import type { InstanceSettings } from "@/features/instance-settings/schema";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { useSafeAction } from "@/lib/safe-action/client";
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

  const updateInstanceSettings = useSafeAction(updateInstanceSettingsAction);
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    const disabled = value === "disabled";
    setDisableUserRegistration(disabled);
    toast.promise(
      updateInstanceSettings.executeAsync({
        disableUserRegistration: disabled,
      }),
      {
        loading: t("saving", { defaultValue: "Saving..." }),
        success: t("saved", { defaultValue: "Saved" }),
        error: t("unexpectedError", { defaultValue: "Unexpected Error" }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="userRegistration">
            <Trans i18nKey="userRegistration" defaults="User Registration" />
          </Label>
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="userRegistrationDescription"
              defaults="Allow new users to register an account."
            />
          </p>
        </div>
        <Select
          value={disableUserRegistration ? "disabled" : "enabled"}
          onValueChange={handleChange}
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
      </div>
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
    </div>
  );
}
