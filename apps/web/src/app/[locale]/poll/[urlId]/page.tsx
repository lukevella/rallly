"use client";
import { cn } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { InfoIcon } from "lucide-react";
import { Trans } from "next-i18next";

import { LoginLink } from "@/components/login-link";
import { Poll } from "@/components/poll";
import { RegisterLink } from "@/components/register-link";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const GuestPollAlert = () => {
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
              className="hover:text-gray-800 underline"
              key="register"
            />,
            <LoginLink className="hover:text-gray-800 underline" key="login" />,
          ]}
        />
      </AlertDescription>
    </Alert>
  );
};

export default function Page() {
  return (
    <div className={cn("max-w-4xl space-y-4 mx-auto")}>
      <div className="-mx-1 space-y-3 sm:space-y-6">
        <GuestPollAlert />
        <Poll />
      </div>
    </div>
  );
}
