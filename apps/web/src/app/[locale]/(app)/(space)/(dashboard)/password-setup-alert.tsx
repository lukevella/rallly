"use client";
import { usePostHog } from "@rallly/posthog/client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { KeyRoundIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { Trans } from "@/i18n/client";

export const PasswordSetupAlert = dynamic(
  () => Promise.resolve(PasswordSetupAlertInner),
  { ssr: false },
);

function PasswordSetupAlertInner() {
  const [dismissed, setDismissed] = useLocalStorage<string>(
    "password_setup_dismissed",
  );
  const posthog = usePostHog();

  return (
    <AnimatePresence initial={true}>
      {!dismissed ? (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ overflow: "hidden" }}
        >
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
                    posthog.capture(
                      "space_dashboard:password_setup_button_click",
                    );
                  }}
                  asChild
                >
                  <Link href="/settings/security">
                    <Trans
                      i18nKey="setupPasswordButton"
                      defaults="Set up password"
                    />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDismissed("1");
                    posthog.capture("space_dashboard:password_setup_dismissed");
                  }}
                >
                  <Trans
                    i18nKey="dismissPasswordSetup"
                    defaults="Don't show again"
                  />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
