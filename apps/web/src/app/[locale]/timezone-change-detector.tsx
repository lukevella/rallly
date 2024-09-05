"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import * as Sentry from "@sentry/nextjs";
import { usePostHog } from "posthog-js/react";
import React, { useState } from "react";

import { Trans } from "@/components/trans";
import { usePreferences } from "@/contexts/preferences";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

export function TimeZoneChangeDetector() {
  const { preferences, updatePreferences } = usePreferences();

  const [previousTimeZone, setPreviousTimeZone] = useState(() => {
    try {
      const cachedPreviousTimeZone = localStorage.getItem("previousTimeZone");
      if (cachedPreviousTimeZone) {
        return cachedPreviousTimeZone;
      }
    } catch (e) {
      Sentry.captureException(e);
    }

    const timeZone = preferences.timeZone ?? getBrowserTimeZone();

    try {
      localStorage.setItem("previousTimeZone", timeZone);
    } catch (e) {
      Sentry.captureException(e);
    }

    return timeZone;
  });
  const currentTimeZone = getBrowserTimeZone();
  const [open, setOpen] = useState(false);

  const posthog = usePostHog();

  React.useEffect(() => {
    if (previousTimeZone !== currentTimeZone) {
      posthog?.capture("timezone change detected");
      setOpen(true);
    }
  }, [previousTimeZone, currentTimeZone, posthog]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="timeZoneChangeDetectorTitle"
              defaults="Timezone Change Detected"
            />
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <Trans
            i18nKey="timeZoneChangeDetectorMessage"
            defaults="Your timezone has changed to <b>{currentTimeZone}</b>. Do you want to update your preferences?"
            components={{ b: <b className="text-foreground font-medium" /> }}
            values={{ currentTimeZone }}
          />
        </p>
        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => {
              localStorage.setItem("previousTimeZone", currentTimeZone);
              updatePreferences({ timeZone: currentTimeZone });
              setOpen(false);
              posthog?.capture("timezone change accepted");
            }}
          >
            <Trans
              i18nKey="yesUpdateTimezone"
              defaults="Yes, update my timezone"
            />
          </Button>
          <Button
            onClick={() => {
              setPreviousTimeZone(currentTimeZone);
              localStorage.setItem("previousTimeZone", currentTimeZone);
              setOpen(false);
              posthog?.capture("timezone change rejected");
            }}
          >
            <Trans
              i18nKey="noKeepCurrentTimezone"
              defaults="No, keep the current timezone"
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
