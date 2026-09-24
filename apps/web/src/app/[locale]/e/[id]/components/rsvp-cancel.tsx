"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { cancelRsvpAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";

export function RsvpCancel({ inviteUid }: { inviteUid: string }) {
  const cancelRsvp = useMutation(mutationOptions(cancelRsvpAction));

  return (
    <p className="text-muted-foreground text-sm">
      <Trans
        i18nKey="rsvpStatusCancelDescription"
        defaults="Can't make it? <a>Cancel your registration</a>"
        components={{
          a: (
            <button
              type="button"
              disabled={cancelRsvp.isPending}
              className="underline hover:text-foreground"
              onClick={() => {
                cancelRsvp.mutate({ inviteUid });
              }}
            />
          ),
        }}
      />
    </p>
  );
}
