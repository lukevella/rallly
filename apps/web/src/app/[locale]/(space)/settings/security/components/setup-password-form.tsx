"use client";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useTranslation } from "react-i18next";

import { Trans } from "@/components/trans";
import { useAuthenticatedUser } from "@/components/user-provider";
import { authClient } from "@/lib/auth-client";

export function SetupPasswordForm() {
  const { user } = useAuthenticatedUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const { t } = useTranslation();

  const onSubmit = async () => {
    setIsLoading(true);

    // For users without passwords, we need to use the password reset flow
    // First request a password reset
    const resetRes = await authClient.requestPasswordReset({
      email: user.email,
      redirectTo: "/reset-password",
    });

    setIsLoading(false);

    if (resetRes.error) {
      toast.error(resetRes.error.message);
      return;
    }

    toast.success(
      t("passwordSetupSuccess", {
        defaultValue:
          "A password reset link has been sent to your email. Follow the link to set your password.",
      }),
    );
  };

  return (
    <div className="max-w-md">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="forgotPasswordDescription"
            defaults="To set a password for your account, we'll send you a secure link via email. Click the link and follow the instructions to create your password."
          />
        </p>

        <Button onClick={onSubmit} loading={isLoading} variant="primary">
          <Trans i18nKey="sendResetLink" defaults="Send reset link" />
        </Button>
      </div>
    </div>
  );
}
