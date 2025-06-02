"use client";

import { Trans } from "@/components/trans";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { setDisableUserRegistration } from "./actions";

export function DisableUserRegistration({
  defaultValue,
}: { defaultValue: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Switch
          id="disable-user-registration"
          onCheckedChange={(checked) => {
            setDisableUserRegistration({ disableUserRegistration: checked });
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
      <p className="text-sm mt-2 text-muted-foreground">
        <Trans
          i18nKey="disableUserRegistrationDescription"
          defaults="Prevent new users from registering an account."
        />
      </p>
    </div>
  );
}
