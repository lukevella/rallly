import "server-only";

import { sendFinalizeParticipantEmail } from "@rallly/emails/templates/finalized-participant";
import { Context, Data, Effect, Layer } from "effect";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

type InviteEmail = Parameters<typeof sendFinalizeParticipantEmail>[0];

export class InviteEmailSendError extends Data.TaggedError(
  "InviteEmailSendError",
)<{ message: string }> {}

/**
 * Whether a failed invite email stays queued for another attempt. Retries
 * are picked up by the house-keeping cron, so an instance without it fails
 * the invite on the first error instead of leaving it pending for good.
 */
export const RetryInviteEmails = Context.Reference<boolean>(
  "rallly/scheduled-event/RetryInviteEmails",
  { defaultValue: () => isFeatureEnabled("houseKeepingCron") },
);

/**
 * Sends the email that tells an invitee the event is booked. The mailer logs
 * and swallows transport failures, so its result is what tells a sent email
 * from a failed one; a render error throws and is folded in here too.
 */
export class InviteEmailSender extends Context.Service<
  InviteEmailSender,
  {
    send(email: InviteEmail): Effect.Effect<void, InviteEmailSendError>;
  }
>()("rallly/scheduled-event/InviteEmailSender") {
  static readonly layer = Layer.succeed(
    InviteEmailSender,
    InviteEmailSender.of({
      send: Effect.fn("InviteEmailSender.send")(function* (email: InviteEmail) {
        const sent = yield* Effect.tryPromise({
          try: () => sendFinalizeParticipantEmail(email),
          catch: (cause) =>
            new InviteEmailSendError({
              message:
                cause instanceof Error
                  ? cause.message
                  : "Email failed to render",
            }),
        });
        if (!sent) {
          return yield* new InviteEmailSendError({
            message: "Transport rejected the email",
          });
        }
      }),
    }),
  );
}
