"use client";

import { useRouter } from "next/navigation";
import { cancelRsvpAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function RsvpCancel({ inviteUid }: { inviteUid: string }) {
  const router = useRouter();
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
                // Re-run the server query so the card reflects the
                // cancellation (a not_found result means it's already gone
                // server-side, so refreshing is correct either way).
                router.refresh();
              }}
            />
          ),
        }}
      />
    </p>
  );
}
