"use client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { MailWarningIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";

export function SetupPasswordForm({ email }: { email: string }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onSubmit = async () => {
    setIsLoading(true);

    // For users without passwords, we need to use the password reset flow
    // First request a password reset
    const resetRes = await authClient.requestPasswordReset({
      email,
      redirectTo: `/reset-password?redirectTo=${encodeURIComponent("/settings/security?setupPassword=true")}`,
    });

    setIsLoading(false);

    if (resetRes.error) {
      toast.error(resetRes.error.message);
      return;
    }

    setIsSuccess(true);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={onSubmit}
        loading={isLoading}
        variant="primary"
        disabled={isSuccess}
      >
        <Trans i18nKey="sendResetLink" defaults="Send reset link" />
      </Button>
      {isSuccess ? (
        <Alert variant="info">
          <MailWarningIcon />
          <AlertDescription>
            <p>
              <Trans
                i18nKey="passwordSetupSuccess"
                defaults="A password reset link has been sent to your email. Follow the link to set your password."
              />
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
