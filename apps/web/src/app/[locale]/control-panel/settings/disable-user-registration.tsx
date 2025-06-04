"use client";

import { Trans } from "@/components/trans";
import {
  type InstanceSettings,
  instanceSettingsSchema,
} from "@/features/instance-settings/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { useForm } from "react-hook-form";
import { updateInstanceSettings } from "./actions";

export function DisableUserRegistration({
  defaultValue,
}: { defaultValue: boolean }) {
  const form = useForm<InstanceSettings>({
    defaultValues: {
      disableUserRegistration: defaultValue,
    },
    resolver: zodResolver(instanceSettingsSchema),
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <Switch
          id="disable-user-registration"
          onCheckedChange={(checked) => {
            updateInstanceSettings({ disableUserRegistration: checked });
          }}
          defaultChecked={defaultValue}
        />
        <Label htmlFor="disable-user-registration">
          <Trans
            i18nKey="disableUserRegistration"
            defaults="Disable User Registration"
          />
        </Label>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        <Trans
          i18nKey="disableUserRegistrationDescription"
          defaults="Prevent new users from registering an account."
        />
      </p>
    </div>
  );
}
