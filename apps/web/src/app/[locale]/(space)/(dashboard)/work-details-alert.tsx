"use client";
import { buttonVariants } from "@rallly/ui";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { BriefcaseIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { Trans } from "@/i18n/client";

/**
 * Asks established work-space accounts for the role and industry that setup
 * now collects. Points at the profile page rather than setup: sending an
 * account that already has a space back through onboarding causes the
 * ping-pong that setup/page.tsx guards against.
 *
 * Dismissal is per-device, like PasswordSetupAlert — dismiss on a laptop and
 * it reappears on a phone. Accepted: it matches the existing pattern, needs
 * no schema, and the failure mode is mild annoyance.
 */
export const WorkDetailsAlert = dynamic(
  () => Promise.resolve(WorkDetailsAlertInner),
  { ssr: false },
);

function WorkDetailsAlertInner() {
  const [dismissed, setDismissed] = useLocalStorage<string>(
    "work_details_dismissed",
  );

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
            <BriefcaseIcon />
            <AlertTitle>
              <Trans
                i18nKey="workDetailsAlertTitle"
                defaults="Help us build for your line of work"
              />
            </AlertTitle>
            <AlertDescription>
              <Trans
                i18nKey="workDetailsAlertDescription"
                defaults="Tell us your role and industry so we know which professional groups to build for. Both are optional."
              />
            </AlertDescription>
            <AlertAction>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDismissed("1");
                  }}
                >
                  <Trans
                    i18nKey="dismissWorkDetails"
                    defaults="Don't show again"
                  />
                </Button>
                <Link
                  href="/settings/profile"
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  <Trans
                    i18nKey="workDetailsAlertButton"
                    defaults="Add details"
                  />
                </Link>
              </div>
            </AlertAction>
          </Alert>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
