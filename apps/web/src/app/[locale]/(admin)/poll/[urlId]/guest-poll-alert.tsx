"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { InfoIcon } from "lucide-react";
import { Trans } from "next-i18next";

import { LoginLink } from "@/components/login-link";
import { RegisterLink } from "@/components/register-link";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

export const GuestPollAlert = () => {
  const poll = usePoll();
  const { user } = useUser();

  if (poll.user) {
    return null;
  }

  if (!user.isGuest) {
    return null;
  }
  return (
    <Alert icon={InfoIcon}>
      <AlertTitle className="mb-1 text-sm font-medium tracking-normal">
        <Trans
          i18nKey="guestPollAlertTitle"
          defaults="Your administrator rights can be lost if you clear your cookies"
        />
      </AlertTitle>
      <AlertDescription className="text-sm">
        <Trans
          i18nKey="guestPollAlertDescription"
          defaults="<0>Create an account</0> or <1>login</1> to claim this poll."
          components={[
            <RegisterLink
              className="underline hover:text-gray-800"
              key="register"
            />,
            <LoginLink className="underline hover:text-gray-800" key="login" />,
          ]}
        />
      </AlertDescription>
    </Alert>
  );
};
