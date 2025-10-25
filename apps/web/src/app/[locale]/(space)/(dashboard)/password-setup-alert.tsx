"use client";
import { usePostHog } from "@rallly/posthog/client";
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
    <div className="flex flex-col items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm sm:flex-row">
      <div className="hidden sm:block">
        <KeyRoundIcon className="size-4 text-indigo-600" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold leading-none">
          <Trans
            i18nKey="setupPasswordAlertTitle"
            defaults="Login quicker with a password"
          />
        </h2>
        <p className="mt-1.5 opacity-75">
          <Trans
            i18nKey="setupPasswordAlertDesc"
            defaults="Set up a password to make logging in faster and more convenient."
          />
        </p>
      </div>
      <div className="flex flex-row-reverse items-center gap-2 sm:flex-row">
        <Button
          variant="ghost"
          onClick={() => {
            setValue("1");
            posthog.capture("space_dashboard:password_setup_dismissed");
          }}
        >
          <Trans i18nKey="dismissPasswordSetup" defaults="Don't show again" />
        </Button>
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
      </div>
    </div>
  );
}
