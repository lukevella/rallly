"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Trans } from "@/i18n/client";
import { RegistrationDialog } from "./registration-dialog";

export function RsvpRegister({ eventId }: { eventId: string }) {
  const dialog = useDialog();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="rsvpCardDescription"
          defaults="To join this event, please register below."
        />
      </p>
      <Button size="lg" variant="primary" {...dialog.triggerProps}>
        <Trans i18nKey="register" defaults="Register" />
      </Button>
      <RegistrationDialog eventId={eventId} {...dialog.dialogProps} />
    </div>
  );
}
