"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { InfoIcon } from "lucide-react";

import { LoginLink } from "@/components/login-link";
import { RegisterLink } from "@/components/register-link";
import { useUser } from "@/components/user-provider";
import { Trans } from "@/i18n/client";

export const GuestPollAlert = () => {
  const { user } = useUser();

  if (user?.isGuest === false) {
    return null;
  }
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>
        <Trans
          i18nKey="guestPollAlertTitle"
          defaults="Your administrator rights can be lost if you clear your cookies"
        />
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          <Trans
            i18nKey="guestPollAlertDescription"
            defaults="<0>Create an account</0> or <1>login</1> to claim this poll."
            components={[
              <RegisterLink
                className="underline hover:text-foreground"
                key="register"
              />,
              <LoginLink
                className="underline hover:text-foreground"
                key="login"
              />,
            ]}
          />
        </p>
      </AlertDescription>
    </Alert>
  );
};
