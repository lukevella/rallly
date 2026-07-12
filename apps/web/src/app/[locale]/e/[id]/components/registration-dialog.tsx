"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { CircleCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Trans } from "@/i18n/client";
import { RegistrationForm } from "./registration-form";

export function RegistrationDialog({
  eventId,
  ...dialogProps
}: { eventId: string } & React.ComponentProps<typeof Dialog>) {
  const router = useRouter();
  const [registration, setRegistration] = React.useState<{
    name: string;
    email: string;
  } | null>(null);

  return (
    <Dialog
      {...dialogProps}
      onOpenChange={(open, eventDetails) => {
        dialogProps.onOpenChange?.(open, eventDetails);
        if (!open) {
          // Reflect the new registration (e.g. the going count) once the
          // dialog is dismissed, then reset for the next time it opens.
          if (registration) {
            router.refresh();
          }
          setRegistration(null);
        }
      }}
    >
      <DialogContent>
        {registration ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CircleCheckIcon className="size-10 text-green-600" />
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="eventRegisterSuccessTitle"
                  defaults="You're registered"
                />
              </DialogTitle>
              <DialogDescription>
                {registration.name} · {registration.email}
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="eventRegisterYourDetails"
                  defaults="Your details"
                />
              </DialogTitle>
            </DialogHeader>
            <RegistrationForm eventId={eventId} onSuccess={setRegistration} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
