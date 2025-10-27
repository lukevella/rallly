"use client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { MailWarningIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Trans } from "@/components/trans";
import { useAuthenticatedUser } from "@/components/user-provider";
import { authClient } from "@/lib/auth-client";

export function SetupPasswordForm() {
  const { user } = useAuthenticatedUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onSubmit = async () => {
    setIsLoading(true);

    if (!user?.email) {
      router.push(
        `/login?redirectTo=${encodeURIComponent("/settings/security")}`,
      );
      return;
    }

    // For users without passwords, we need to use the password reset flow
    // First request a password reset
    const resetRes = await authClient.requestPasswordReset({
      email: user.email,
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
