"use client";

import { cancelRsvpAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function RsvpCancel({ inviteUid }: { inviteUid: string }) {
  const cancelRsvp = useSafeAction(cancelRsvpAction);

  return (
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
              }}
            />
          ),
        }}
      />
    </p>
  );
}
