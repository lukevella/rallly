"use client";

import { CircleCheckIcon } from "lucide-react";
import { cancelRsvpAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { useRegistrationFlow } from "./registration-flow";

export function RsvpStatus({ children }: { children: React.ReactNode }) {
  const { registration, clearRegistration } = useRegistrationFlow();
  const cancelRsvp = useSafeAction(cancelRsvpAction);

  if (!registration) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <CircleCheckIcon className="size-9 shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-foreground text-sm">
            <Trans i18nKey="rsvpStatusRegistered" defaults="You're going!" />
          </p>
          <p className="text-muted-foreground text-sm">
            {registration.name} · {registration.email}
          </p>
        </div>
      </div>
      {registration.inviteUid ? (
        <>
          <hr className="my-2" />
          <div>
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="rsvpStatusCancelDescription"
                defaults="Can't make it? <a>Cancel your registration</a>"
                components={{
                  a: (
                    <button
                      type="button"
                      disabled={cancelRsvp.isExecuting}
                      className="underline hover:text-foreground"
                      onClick={async () => {
                        const inviteUid = registration.inviteUid;
                        if (!inviteUid) {
                          return;
                        }
                        await cancelRsvp.executeAsync({ inviteUid });
                        // A not_found result means the registration is
                        // already gone server-side, so clear local state
                        // either way.
                        clearRegistration();
                      }}
                    />
                  ),
                }}
              />
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
