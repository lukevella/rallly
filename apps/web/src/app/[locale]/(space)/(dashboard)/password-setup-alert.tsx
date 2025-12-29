"use client";
import { usePostHog } from "@rallly/posthog/client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { KeyRoundIcon } from "lucide-react";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { Trans } from "@/components/trans";

export function PasswordSetupAlert() {
  const [value, setValue] = useLocalStorage<string>("password_setup_dismissed");
  const posthog = usePostHog();

  if (value) {
    return null;
  }

  return (
    <Alert>
      <KeyRoundIcon />
      <AlertTitle>
        <Trans
          i18nKey="setupPasswordAlertTitle"
          defaults="Login quicker with a password"
        />
      </AlertTitle>
      <AlertDescription>
        <p>
          <Trans
            i18nKey="setupPasswordAlertDesc"
            defaults="Set up a password to make logging in faster and more convenient."
          />
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              posthog.capture("space_dashboard:password_setup_button_click");
            }}
            asChild
          >
            <Link href="/settings/security">
              <Trans i18nKey="setupPasswordButton" defaults="Set up password" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setValue("1");
              posthog.capture("space_dashboard:password_setup_dismissed");
            }}
          >
            <Trans i18nKey="dismissPasswordSetup" defaults="Don't show again" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
