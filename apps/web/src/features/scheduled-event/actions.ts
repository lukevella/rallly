"use server";

import { headers } from "next/headers";
import * as z from "zod";
import {
  getEventAcceptedCount,
  getPublicScheduledEvent,
} from "@/features/scheduled-event/data";
import { cancelRsvp, createRsvp } from "@/features/scheduled-event/mutations";
import {
  getEventPhase,
  isEventFull,
} from "@/features/scheduled-event/registration";
import { authLib, getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";
import { actionClient, authActionClient } from "@/lib/safe-action/server";

// Re-validates the registration gate server-side — never trust that the client
// only offered registration when the event was actually open.
async function assertRegistrationOpen(eventId: string) {
  const event = await getPublicScheduledEvent(eventId);

  if (!event || event.deletedAt) {
    throw new AppError({ code: "NOT_FOUND", message: "Event not found" });
  }

  const phase = getEventPhase({
    status: event.status,
    start: event.start,
    end: event.end,
    now: new Date(),
  });

  if (phase !== "upcoming") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Registration is closed for this event",
    });
  }

  const acceptedCount = await getEventAcceptedCount({ eventId });

  if (isEventFull({ capacity: event.capacity, acceptedCount })) {
    throw new AppError({ code: "FORBIDDEN", message: "Event is full" });
  }
}

export const submitRsvpAction = actionClient
  .metadata({ actionName: "submit_rsvp" })
  .inputSchema(
    z.object({
      eventId: z.string(),
      name: z.string().trim().min(1).max(100),
      email: z.email(),
      status: z.enum(["accepted", "declined"]),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { eventId, name, email, status } = parsedInput;

    await assertRegistrationOpen(eventId);

    // Tie the registration to a session so guests can manage it (e.g. cancel)
    // without an account. Reuse an existing session — anonymous or real —
    // otherwise create a fresh anonymous one.
    const session = await getSession();
    let inviteeId: string;
    if (session?.user) {
      inviteeId = session.user.id;
    } else {
      const { user } = await authLib.api.signInAnonymous({
        headers: await headers(),
      });
      inviteeId = user.id;
    }

    return await createRsvp({ eventId, name, email, status, inviteeId });
  });

export const registerForEventAction = authActionClient
  .metadata({ actionName: "register_for_event" })
  .inputSchema(z.object({ eventId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const { eventId } = parsedInput;

    await assertRegistrationOpen(eventId);

    return await createRsvp({
      eventId,
      name: ctx.user.name,
      email: ctx.user.email,
      status: "accepted",
      inviteeId: ctx.user.id,
    });
  });

export const cancelRsvpAction = actionClient
  .metadata({ actionName: "cancel_rsvp" })
  .inputSchema(
    z.object({
      // The invite uid is an unguessable token that acts as proof of
      // ownership, so the registrant can cancel without re-authenticating.
      inviteUid: z.string().min(1).max(255),
    }),
  )
  .action(async ({ parsedInput }) => {
    return await cancelRsvp({ inviteUid: parsedInput.inviteUid });
  });
