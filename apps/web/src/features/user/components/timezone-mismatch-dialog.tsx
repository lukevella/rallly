"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import React from "react";
import { updateLocalizationAction } from "@/features/user/actions";
import { Trans } from "@/i18n/client";
import { useTimeZoneChange } from "@/lib/datetime/timezone-sync";
import { useSafeAction } from "@/lib/safe-action/client";

/**
 * Offers to update the account's home time zone when TimeZoneSync detects
 * that the viewer has moved since their last visit. Consuming the change
 * event (rather than comparing zones directly) means a standing mismatch the
 * user created deliberately — picking a different home zone in settings, or
 * declining this prompt before — never re-prompts; only an actual move does.
 */
export function TimeZoneMismatchDialog({
  homeTimeZone,
}: {
  homeTimeZone?: string;
}) {
  const change = useTimeZoneChange();

  const [prompt, setPrompt] = React.useState<{ currentTimeZone: string }>();

  const updateLocalization = useSafeAction(updateLocalizationAction);

  React.useEffect(() => {
    if (change && homeTimeZone && change.currentTimeZone !== homeTimeZone) {
      setPrompt({ currentTimeZone: change.currentTimeZone });
      change.acknowledge();
    }
  }, [change, homeTimeZone]);

  if (!prompt) {
    return null;
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setPrompt(undefined);
        }
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="timeZoneMismatchDialogTitle"
              defaults="Time zone mismatch detected"
            />
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <Trans
            i18nKey="timeZoneMismatchDialogMessage"
            defaults="It looks like you are in <b>{currentTimeZone}</b> but your time zone is set to <b>{homeTimeZone}</b>. Do you want to update it?"
            components={{ b: <b className="font-medium text-foreground" /> }}
            values={{ currentTimeZone: prompt.currentTimeZone, homeTimeZone }}
          />
        </p>
        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => {
              updateLocalization.execute({
                timeZone: prompt.currentTimeZone,
              });
              setPrompt(undefined);
            }}
          >
            <Trans
              i18nKey="yesUpdateTimezone"
              defaults="Yes, update my time zone"
            />
          </Button>
          <Button
            onClick={() => {
              setPrompt(undefined);
            }}
          >
            <Trans
              i18nKey="noKeepCurrentTimezone"
              defaults="No, keep the current time zone"
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
