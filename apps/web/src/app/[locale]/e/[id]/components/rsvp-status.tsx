"use client";

import { CircleCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cancelRsvpAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function RsvpStatus({
  name,
  email,
  inviteUid,
}: {
  name: string;
  email: string;
  inviteUid: string;
}) {
  const router = useRouter();
  const cancelRsvp = useSafeAction(cancelRsvpAction);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <CircleCheckIcon className="size-9 shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-foreground text-sm">
            <Trans i18nKey="rsvpStatusRegistered" defaults="You're going!" />
          </p>
          <p className="text-muted-foreground text-sm">
            {name} · {email}
          </p>
        </div>
      </div>
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
                    await cancelRsvp.executeAsync({ inviteUid });
                    // Re-run the server query so the card reflects the
                    // cancellation (a not_found result means it's already
                    // gone server-side, so refreshing is correct either way).
                    router.refresh();
                  }}
                />
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
}
