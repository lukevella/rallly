import "server-only";

import type { ScheduledEventInviteStatus } from "@rallly/database";
import { Prisma, prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { Clock, Data, Effect } from "effect";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { getSpaceBranding } from "@/emails/branding";
import { toEmailConferencing } from "@/emails/conferencing";
import { parseConferencing } from "@/features/conferencing/data";
import { getConferencingUri } from "@/features/conferencing/utils";
import { parseLocation } from "@/features/location/data";
import { formatLocationText } from "@/features/location/utils";
import {
  INVITE_EMAIL_BATCH_SIZE,
  INVITE_EMAIL_CLAIM_TIMEOUT_MS,
  INVITE_EMAIL_CONCURRENCY,
  MAX_INVITE_EMAIL_ATTEMPTS,
  scheduledEventTag,
} from "@/features/scheduled-event/constants";
import type { DatabaseError } from "@/lib/effect/db";
import { fromPrisma } from "@/lib/effect/db";
import { runtime } from "@/lib/effect/runtime";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { createIcsEvent } from "@/lib/utils/ics";
import { listInviteEmailData } from "./data";
import { InviteEmailSender, RetryInviteEmails } from "./service";
import { formatEventDateTime } from "./utils";

const logger = createLogger("scheduled-event/invite-email");

export async function createRsvp({
  eventId,
  name,
  email,
  status,
  inviteeId,
  locale,
  timeZone,
}: {
  eventId: string;
  name: string;
  email: string;
  status: Extract<ScheduledEventInviteStatus, "accepted" | "declined">;
  // Links the registration to a user account when the registrant is logged in.
  inviteeId?: string;
  // Captured at registration time so later emails (confirmation, cancellation)
  // can render in the invitee's language and zone.
  locale?: string;
  timeZone?: string;
}) {
  let invite: { uid: string };
  try {
    // The unique (scheduledEventId, inviteeEmail) index makes this atomic: a
    // concurrent duplicate fails with P2002 instead of racing past a prior
    // existence check.
    invite = await prisma.scheduledEventInvite.create({
      data: {
        uid: nanoid(),
        scheduledEventId: eventId,
        inviteeName: name,
        inviteeEmail: email,
        inviteeId,
        inviteeLocale: locale,
        inviteeTimeZone: timeZone,
        status,
      },
      select: { uid: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, reason: "already_responded" } as const;
    }
    throw e;
  }

  updateTag(scheduledEventTag(eventId));

  return { ok: true, inviteUid: invite.uid } as const;
}

export async function cancelRsvp({ inviteUid }: { inviteUid: string }) {
  const invite = await prisma.scheduledEventInvite.findUnique({
    where: { uid: inviteUid },
    select: { id: true, scheduledEventId: true },
  });

  if (!invite) {
    return { ok: false, reason: "not_found" } as const;
  }

  await prisma.scheduledEventInvite.delete({ where: { id: invite.id } });

  updateTag(scheduledEventTag(invite.scheduledEventId));

  return { ok: true } as const;
}

/** Limits an invite email run to one event's invites. */
export type InviteEmailScope = { scheduledEventId: string };

/**
 * Pending invites whose final attempt was claimed by a run that never
 * recorded an outcome. Every other exhausted invite is marked failed when
 * its last attempt fails.
 */
export const failAbandonedInviteEmails = Effect.fn(
  "scheduledEvent.failAbandonedInviteEmails",
)(function* ({ now }: { now: Date }) {
  const { count } = yield* fromPrisma(() =>
    prisma.scheduledEventInvite.updateMany({
      where: {
        emailStatus: "pending",
        emailAttempts: { gte: MAX_INVITE_EMAIL_ATTEMPTS },
        emailClaimedAt: {
          lt: new Date(now.getTime() - INVITE_EMAIL_CLAIM_TIMEOUT_MS),
        },
      },
      data: { emailStatus: "failed", emailClaimedAt: null },
    }),
  );
  return count;
});

/**
 * Claims a batch of pending invite emails in one statement. SKIP LOCKED lets
 * overlapping runs claim disjoint batches instead of queueing behind each
 * other, and the attempt is counted at claim time so an invite whose send
 * keeps killing the run still exhausts.
 */
export const claimInviteEmails = Effect.fn("scheduledEvent.claimInviteEmails")(
  function* ({
    now,
    limit,
    scope,
  }: {
    now: Date;
    limit: number;
    scope?: InviteEmailScope;
  }) {
    const staleBefore = new Date(now.getTime() - INVITE_EMAIL_CLAIM_TIMEOUT_MS);
    const rows = yield* fromPrisma(
      () => prisma.$queryRaw<{ id: string }[]>`
        UPDATE scheduled_event_invites
        SET email_claimed_at = ${now},
            email_attempts = email_attempts + 1,
            updated_at = ${now}
        WHERE id IN (
          SELECT id FROM scheduled_event_invites
          WHERE email_status = 'pending'
            AND email_attempts < ${MAX_INVITE_EMAIL_ATTEMPTS}
            AND (email_claimed_at IS NULL OR email_claimed_at < ${staleBefore})
            ${
              scope
                ? Prisma.sql`AND scheduled_event_id = ${scope.scheduledEventId}`
                : Prisma.empty
            }
          ORDER BY created_at, id
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id`,
    );
    return rows.map((row) => row.id);
  },
);

type InviteEmailData = Awaited<ReturnType<typeof listInviteEmailData>>[number];

export type InviteEmailOutcome = "sent" | "skipped" | "retrying" | "failed";

class InviteEmailBuildError extends Data.TaggedError("InviteEmailBuildError")<{
  message: string;
}> {}

/**
 * Builds and sends one invite email from the event as it is now. An event
 * that was canceled or deleted, or booked by an account banned since, is
 * skipped rather than sent. A failure is data here: the invite is claimed,
 * and an error escaping would leave it to the claim timeout.
 */
export const attemptInviteEmail = Effect.fn(
  "scheduledEvent.attemptInviteEmail",
)(
  function* (invite: InviteEmailData) {
    const event = invite.scheduledEvent;
    const poll = event.polls[0];
    if (
      !poll?.user ||
      event.deletedAt ||
      event.status === "canceled" ||
      event.user.banned ||
      poll.user.banned
    ) {
      return { ok: false, skip: true } as const;
    }

    const location = parseLocation(event.location, {
      scheduledEventId: event.id,
    });
    const conferencing = parseConferencing(event.conferencing, {
      scheduledEventId: event.id,
    });
    const locationText = location ? formatLocationText(location) : undefined;
    const conferencingUri = conferencing
      ? getConferencingUri(conferencing)
      : undefined;

    // The same event the host's confirmation carries: one UID, one
    // organizer, so every copy lands as the same calendar entry.
    const ics = createIcsEvent({
      uid: event.uid,
      sequence: event.sequence,
      title: event.title,
      location: locationText || conferencingUri,
      description:
        [event.description, conferencingUri].filter(Boolean).join("\n\n") ||
        undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      timeZone: event.timeZone ?? undefined,
      organizer: { name: poll.user.name, email: poll.user.email },
    });
    if (ics.error || !ics.value) {
      return yield* new InviteEmailBuildError({
        message: ics.error?.message ?? "Failed to generate ics",
      });
    }

    const locale = invite.inviteeLocale ?? undefined;
    const { date, time } = formatEventDateTime({
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      timeZone: event.timeZone,
      inviteeTimeZone: invite.inviteeTimeZone,
      locale,
    });
    const branding = yield* fromPrisma(() => getSpaceBranding(event.space));

    const sender = yield* InviteEmailSender;
    yield* sender.send({
      to: invite.inviteeEmail,
      locale,
      branding,
      icalEvent: {
        filename: "invite.ics",
        method: "request",
        content: ics.value,
      },
      props: {
        pollUrl: shortUrl(`/invite/${poll.id}`),
        title: event.title,
        hostName: poll.user.name,
        location: locationText,
        conferencing: conferencing
          ? toEmailConferencing(conferencing)
          : undefined,
        date,
        time,
      },
    });
    return { ok: true } as const;
  },
  Effect.catchTags({
    InviteEmailBuildError: (error) =>
      Effect.succeed({ ok: false, skip: false, error: error.message } as const),
    InviteEmailSendError: (error) =>
      Effect.succeed({ ok: false, skip: false, error: error.message } as const),
    DatabaseError: () =>
      Effect.succeed({
        ok: false,
        skip: false,
        error: "Failed to load branding",
      } as const),
  }),
);

/**
 * Records an attempt. A failure with attempts left keeps its claim, so the
 * invite waits out the claim timeout before the cron's next try. Every write is
 * conditional on the invite still being pending, so it cannot undo a skip
 * applied while the send was in flight.
 */
export const recordInviteEmailResult = Effect.fn(
  "scheduledEvent.recordInviteEmailResult",
)(function* ({
  inviteId,
  attempts,
  result,
  now,
}: {
  inviteId: string;
  attempts: number;
  result: { ok: true } | { ok: false; skip: boolean; error?: string };
  now: Date;
}) {
  const where = { id: inviteId, emailStatus: "pending" } as const;
  if (result.ok) {
    yield* fromPrisma(() =>
      prisma.scheduledEventInvite.updateMany({
        where,
        data: { emailStatus: "sent", emailSentAt: now, emailClaimedAt: null },
      }),
    );
    return "sent" satisfies InviteEmailOutcome as InviteEmailOutcome;
  }
  if (result.skip) {
    yield* fromPrisma(() =>
      prisma.scheduledEventInvite.updateMany({
        where,
        data: { emailStatus: "skipped", emailClaimedAt: null },
      }),
    );
    return "skipped" satisfies InviteEmailOutcome as InviteEmailOutcome;
  }
  logger.warn(
    { inviteId, attempts, error: result.error },
    "Invite email attempt failed",
  );
  if ((yield* RetryInviteEmails) && attempts < MAX_INVITE_EMAIL_ATTEMPTS) {
    return "retrying" satisfies InviteEmailOutcome as InviteEmailOutcome;
  }
  yield* fromPrisma(() =>
    prisma.scheduledEventInvite.updateMany({
      where,
      data: { emailStatus: "failed", emailClaimedAt: null },
    }),
  );
  return "failed" satisfies InviteEmailOutcome as InviteEmailOutcome;
});

export type DeliverInviteEmailsSummary = Record<
  InviteEmailOutcome | "attempted" | "abandoned",
  number
>;

/**
 * One run: fail abandoned final attempts, claim a batch, send it a few at a
 * time and record every outcome. The scheduled run covers every event; a
 * run triggered by a booking is scoped to that event so its first batch
 * goes out at once.
 */
export const deliverInviteEmails = Effect.fn(
  "scheduledEvent.deliverInviteEmails",
)(function* ({
  now,
  scope,
}: {
  now: Date;
  scope?: InviteEmailScope;
}): Effect.fn.Return<
  DeliverInviteEmailsSummary,
  DatabaseError,
  InviteEmailSender
> {
  const abandoned = scope ? 0 : yield* failAbandonedInviteEmails({ now });
  const inviteIds = yield* claimInviteEmails({
    now,
    limit: INVITE_EMAIL_BATCH_SIZE,
    scope,
  });
  const invites =
    inviteIds.length > 0
      ? yield* fromPrisma(() => listInviteEmailData({ inviteIds }))
      : [];

  const outcomes = yield* Effect.forEach(
    invites,
    Effect.fn("scheduledEvent.deliverInviteEmail")(function* (invite) {
      const result = yield* attemptInviteEmail(invite);
      return yield* recordInviteEmailResult({
        inviteId: invite.id,
        attempts: invite.emailAttempts,
        result,
        now: new Date(yield* Clock.currentTimeMillis),
      });
    }),
    { concurrency: INVITE_EMAIL_CONCURRENCY },
  );

  const summary: DeliverInviteEmailsSummary = {
    abandoned,
    attempted: invites.length,
    sent: 0,
    skipped: 0,
    retrying: 0,
    failed: 0,
  };
  for (const outcome of outcomes) {
    summary[outcome]++;
  }
  return summary;
});

/**
 * Sends a booked event's first batch of invite emails once the response is
 * out, so a typical poll's participants hear within seconds. Where the
 * house-keeping cron runs, it drains whatever is left at its own pace.
 * Without it, this run stands in for the cron: it is unscoped and keeps
 * going until the queue is empty, so it also recovers claims an earlier run
 * abandoned. Needs a request scope for `after`.
 */
export function scheduleInviteEmailDelivery(scope: InviteEmailScope) {
  const drain = !isFeatureEnabled("houseKeepingCron");
  after(async () => {
    try {
      for (;;) {
        const summary = await runtime.runPromise(
          deliverInviteEmails({
            now: new Date(),
            scope: drain ? undefined : scope,
          }).pipe(Effect.provide(InviteEmailSender.layer)),
        );
        if (!drain || summary.attempted < INVITE_EMAIL_BATCH_SIZE) {
          return;
        }
      }
    } catch (error) {
      logger.error(
        { ...scope, error },
        "Invite email delivery after booking failed",
      );
    }
  });
}
