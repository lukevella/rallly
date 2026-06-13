"use client";

import { Button } from "@rallly/ui/button";
import { Trans } from "@/i18n/client";
import { useRegistrationFlow } from "./registration-flow";

export function RsvpRegister() {
  const flow = useRegistrationFlow();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="rsvpCardDescription"
          defaults="To join this event, please register below."
        />
      </p>
      <Button
        size="lg"
        variant="primary"
        onClick={() => flow.setView("register")}
      >
        <Trans i18nKey="register" defaults="Register" />
      </Button>
    </div>
  );
}
