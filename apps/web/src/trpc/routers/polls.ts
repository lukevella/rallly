import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendFinalizeHostEmail } from "@rallly/emails/templates/finalized-host";
import { sendFinalizeParticipantEmail } from "@rallly/emails/templates/finalized-participant";
import { sendNewPollEmail } from "@rallly/emails/templates/new-poll";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import * as z from "zod";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { posthog } from "@/features/analytics/posthog";
import { moderateContent } from "@/features/moderation";
import { getPolls } from "@/features/poll/data";
import { canUserManagePoll } from "@/features/poll/helpers";
import { hasPollAdminAccess } from "@/features/poll/query";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
import { getActiveSpaceForUser } from "@/features/space/data";
import { dayjs } from "@/lib/dayjs";
import { createIcsEvent } from "@/lib/utils/ics";
import {
  createRateLimitMiddleware,
  possiblyPublicProcedure,
  privateProcedure,
  proProcedure,
  publicProcedure,
  requireUserMiddleware,
  router,
  spaceProcedure,
} from "../trpc";
import { comments } from "./polls/comments";
import { participants } from "./polls/participants";
import { getScheduledEventTimes } from "./polls/scheduled-event-times";
import { timeZoneInput } from "./polls/schema";

const collapseNewlines = (s: string) => s.replace(/\n{3,}/g, "\n\n");

// Mirrors the auto-close-polls house-keeping task: an option ends at
// start + duration, with all-day options (duration 0) treated as 24h.
const optionEndsInFuture = (option: { startTime: Date; duration: number }) =>
  dayjs(option.startTime)
    .add(option.duration === 0 ? 24 * 60 : option.duration, "minute")
    .isAfter(dayjs());

export const polls = router({
  participants,
  comments,
  infiniteChronological: spaceProcedure
    .input(
      z.object({
        status: z.enum(["open", "closed", "scheduled", "canceled"]).optional(),
        search: z.string().optional(),
        member: z.string().optional(),
        cursor: z.number().optional().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;

      const result = await getPolls({
        status,
        q: search,
        member,
        page,
        pageSize,
        spaceId: ctx.space.id,
      });

      let nextCursor: number | undefined;
      if (result.hasNextPage) {
        nextCursor = page + 1;
      }

      return {
        polls: result.polls.map((poll) => ({
          ...poll,
          inviteLink: shortUrl(`/invite/${poll.id}`),
        })),
        nextCursor,
        hasNextPage: result.hasNextPage,
        total: result.total,
      };
    }),
  getCountByStatus: privateProcedure.query(async ({ ctx }) => {
    const res = await prisma.poll.groupBy({
      by: ["status"],
      where: {
        userId: ctx.user.id,
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    });

    return res.reduce(
      (acc, { status, _count }) => {
        acc[status] = _count.status;
        return acc;
      },
      {} as Record<PollStatus, number>,
    );
  }),

  make: possiblyPublicProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        timeZone: timeZoneInput,
        location: z.string().trim().optional(),
        description: z.string().trim().transform(collapseNewlines).optional(),
        hideParticipants: z.boolean().optional(),
        hideScores: z.boolean().optional(),
        disableComments: z.boolean().optional(),
        requireParticipantEmail: z.boolean().optional(),
        options: z
          .object({
            startDate: z.string(),
            endDate: z.string().optional(),
          })
          .array()
          .min(1),
      }),
    )
    .use(requireUserMiddleware)
    .use(createRateLimitMiddleware("create_poll", 20, "1 h"))
    .mutation(async ({ ctx, input }) => {
      const activeSpace = ctx.user.isGuest
        ? null
        : await getActiveSpaceForUser(ctx.user.id);

      if (!ctx.user.isGuest && !activeSpace) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of a space to create a poll",
        });
      }

      const isPro = activeSpace?.tier === "pro";

      const moderation = await moderateContent({
        userId: ctx.user.id,
        content: {
          Title: input.title,
          Description: input.description || "",
          Location: input.location || "",
        },
        trusted: isPro,
      });

      if (moderation.verdict !== "safe") {
        posthog()?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "create_poll",
            verdict: moderation.verdict,
            reason: moderation.reason,
          },
        });
      }

      if (moderation.verdict === "flagged") {
        return {
          ok: false as const,
          error: { code: "INAPPROPRIATE_CONTENT" as const },
        };
      }

      const title = input.title;
      const location = input.location || undefined;
      const description = input.description || undefined;
      const adminToken = nanoid();
      const participantUrlId = nanoid();
      const pollId = nanoid();
      const spaceId = activeSpace?.id;

      // Date-only (all-day) options are floating: they are stored at UTC
      // midnight so they never shift across timezones. A falsy poll.timeZone
      // is the single source of truth for "floating", so date-only polls drop
      // any timezone the client sent, and date-only options of mixed polls
      // ignore the poll's timezone.
      const isTimePoll = input.options.some((option) => option.endDate);
      const timeZone = isTimePoll ? input.timeZone : null;

      const optionsData = input.options.map((option) => ({
        startTime:
          timeZone && option.endDate
            ? dayjs(option.startDate).tz(timeZone, true).toDate()
            : dayjs(option.startDate).utc(true).toDate(),
        duration: option.endDate
          ? dayjs(option.endDate).diff(dayjs(option.startDate), "minute")
          : 0,
      }));

      const kind = isTimePoll ? "time" : "date";

      const poll = await prisma.poll.create({
        include: {
          options: {
            select: {
              id: true,
            },
          },
        },
        data: {
          id: pollId,
          title,
          timeZone,
          location,
          description,
          adminUrlId: adminToken,
          participantUrlId,
          userId: ctx.user.id,
          kind,
          options: {
            createMany: {
              data: optionsData,
            },
          },
          hideParticipants: input.hideParticipants,
          disableComments: input.disableComments,
          hideScores: input.hideScores,
          requireParticipantEmail: input.requireParticipantEmail,
          spaceId,
        },
      });

      const pollLink = absoluteUrl(`/poll/${pollId}`);

      const participantLink = shortUrl(`/invite/${pollId}`);

      if (ctx.user.isGuest === false) {
        const user = await prisma.user.findUnique({
          select: { email: true, name: true },
          where: { id: ctx.user.id },
        });

        if (user) {
          after(async () =>
            sendNewPollEmail({
              to: user.email,
              locale: ctx.user.locale ?? undefined,
              branding: await getInstanceBranding(),
              props: {
                title: poll.title,
                name: user.name,
                adminLink: pollLink,
                participantLink,
              },
            }),
          );
        }
      }

      posthog()?.groupIdentify({
        groupType: "poll",
        groupKey: poll.id,
        properties: {
          name: poll.title,
          status: poll.status,
          is_guest: ctx.user.isGuest,
          created_at: poll.createdAt,
          comment_count: 0,
          option_count: poll.options.length,
          has_location: !!location,
          has_description: !!description,
          timezone: input.timeZone,
          muted: poll.muted,
        },
      });

      posthog()?.capture({
        event: "poll_create",
        distinctId: ctx.user.id,
        properties: {
          title: poll.title,
          optionCount: poll.options.length,
          hasLocation: !!location,
          hasDescription: !!description,
          timezone: input.timeZone,
          disableComments: poll.disableComments,
          hideParticipants: poll.hideParticipants,
          hideScores: poll.hideScores,
          requireParticipantEmail: poll.requireParticipantEmail,
          isGuest: ctx.user.isGuest,
        },
        groups: {
          poll: poll.id,
          ...(poll.spaceId ? { space: poll.spaceId } : {}),
        },
      });

      return { ok: true as const, data: { id: poll.id } };
    }),
  modify: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
        title: z.string().trim().optional(),
        timeZone: timeZoneInput,
        location: z.string().trim().optional(),
        description: z.string().trim().transform(collapseNewlines).optional(),
        optionsToDelete: z.string().array().optional(),
        optionsToAdd: z.string().array().optional(),
        hideParticipants: z.boolean().optional(),
        disableComments: z.boolean().optional(),
        hideScores: z.boolean().optional(),
        requireParticipantEmail: z.boolean().optional(),
      }),
    )
    .use(requireUserMiddleware)
    .use(createRateLimitMiddleware("update_poll", 10, "1 m"))
    .mutation(async ({ input, ctx }) => {
      const pollId = input.pollId;

      if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this poll",
        });
      }

      const activeSpace = ctx.user.isGuest
        ? null
        : await getActiveSpaceForUser(ctx.user.id);
      const isPro = activeSpace?.tier === "pro";

      const moderation = await moderateContent({
        userId: ctx.user.id,
        content: {
          Title: input.title || "",
          Description: input.description || "",
          Location: input.location || "",
        },
        trusted: isPro,
      });

      if (moderation.verdict !== "safe") {
        posthog()?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "update_poll",
            verdict: moderation.verdict,
            reason: moderation.reason,
          },
        });
      }

      if (moderation.verdict === "flagged") {
        return {
          ok: false as const,
          error: { code: "INAPPROPRIATE_CONTENT" as const },
        };
      }

      await prisma.$transaction(async (tx) => {
        const newOptions =
          input.optionsToAdd?.map((optionValue) => {
            const [start, end] = optionValue.split("/");

            if (end) {
              return {
                startTime: input.timeZone
                  ? dayjs(start).tz(input.timeZone, true).toDate()
                  : dayjs(start).utc(true).toDate(),
                duration: dayjs(end).diff(dayjs(start), "minute"),
                pollId,
              };
            } else {
              return {
                startTime: dayjs(start).utc(true).toDate(),
                duration: 0,
                pollId,
              };
            }
          }) ?? [];

        // Reopen an auto-closed poll when new future dates are added. Manually
        // closed polls stay closed — that was the organizer's decision.
        let reopen = false;
        if (newOptions.some(optionEndsInFuture)) {
          const poll = await tx.poll.findUnique({
            where: { id: pollId },
            select: { status: true, closedReason: true },
          });
          reopen = poll?.status === "closed" && poll.closedReason === "auto";
        }

        if (input.optionsToDelete && input.optionsToDelete.length > 0) {
          await tx.option.deleteMany({
            where: {
              pollId,
              id: {
                in: input.optionsToDelete,
              },
            },
          });
        }

        if (newOptions.length > 0) {
          await tx.option.createMany({
            data: newOptions,
          });
        }

        const remainingOptions = await tx.option.count({ where: { pollId } });
        if (remainingOptions === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A poll must have at least one option",
          });
        }

        const maxDuration = await tx.option.aggregate({
          where: { pollId },
          _max: { duration: true },
        });
        const kind = (maxDuration._max.duration ?? 0) > 0 ? "time" : "date";

        await tx.poll.update({
          select: { id: true },
          where: {
            id: pollId,
          },
          data: {
            title: input.title,
            location: input.location,
            description: input.description,
            // Date-only polls are floating: keep timeZone null so it stays the
            // single source of truth for whether options are timezone-bound.
            timeZone: kind === "time" ? input.timeZone : null,
            hideScores: input.hideScores,
            hideParticipants: input.hideParticipants,
            disableComments: input.disableComments,
            requireParticipantEmail: input.requireParticipantEmail,
            kind,
            ...(reopen ? { status: "open" as const, closedReason: null } : {}),
          },
        });
      });

      // Get updated poll data for group update
      const updatedPoll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          title: true,
          status: true,
          createdAt: true,
          location: true,
          description: true,
          disableComments: true,
          requireParticipantEmail: true,
          hideParticipants: true,
          hideScores: true,
          timeZone: true,
          _count: {
            select: {
              participants: {
                where: { deleted: false },
              },
              comments: true,
              options: true,
            },
          },
        },
      });

      if (!updatedPoll) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      // Track specific poll update events based on what was changed
      const hasDetailsUpdate =
        input.title !== undefined ||
        input.location !== undefined ||
        input.description !== undefined;
      const hasOptionsUpdate =
        (input.optionsToDelete && input.optionsToDelete.length > 0) ||
        (input.optionsToAdd && input.optionsToAdd.length > 0);
      const hasSettingsUpdate =
        input.timeZone !== undefined ||
        input.hideParticipants !== undefined ||
        input.disableComments !== undefined ||
        input.hideScores !== undefined ||
        input.requireParticipantEmail !== undefined;

      if (hasDetailsUpdate) {
        posthog()?.capture({
          event: "poll_update_details",
          distinctId: ctx.user.id,
          properties: {
            title: updatedPoll.title,
            has_location: !!updatedPoll.location,
            has_description: !!updatedPoll.description,
            is_guest: ctx.user.isGuest,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      if (hasOptionsUpdate) {
        posthog()?.capture({
          event: "poll_update_options",
          distinctId: ctx.user.id,
          properties: {
            option_count: updatedPoll._count.options,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      if (hasSettingsUpdate) {
        posthog()?.capture({
          event: "poll_update_settings",
          distinctId: ctx.user.id,
          properties: {
            disable_comments: !!updatedPoll.disableComments,
            hide_participants: !!updatedPoll.hideParticipants,
            hide_scores: !!updatedPoll.hideScores,
            require_participant_email: !!updatedPoll.requireParticipantEmail,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      return { ok: true as const };
    }),
  markAsDeleted: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input: { pollId }, ctx }) => {
      const hasAccess = await hasPollAdminAccess(pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to mark this poll as deleted",
        });
      }

      await prisma.poll.update({
        where: { id: pollId },
        data: { deleted: true, deletedAt: new Date() },
      });

      // Track poll deletion analytics
      posthog()?.capture({
        event: "poll_delete",
        distinctId: ctx.user.id,
        groups: {
          poll: pollId,
        },
      });
    }),
  // END LEGACY ROUTES
  toggleMuted: privateProcedure
    .input(z.object({ pollId: z.string(), muted: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const poll = await prisma.poll.findUnique({
        where: { id: input.pollId },
        select: { userId: true },
      });

      if (!poll || poll.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the poll owner can mute notifications",
        });
      }

      await prisma.poll.update({
        where: { id: input.pollId },
        data: { muted: input.muted },
      });

      posthog()?.groupIdentify({
        groupType: "poll",
        groupKey: input.pollId,
        properties: {
          muted: input.muted,
        },
      });
    }),
  get: publicProcedure
    .input(
      z.object({
        urlId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const res = await prisma.poll.findUnique({
        select: {
          id: true,
          timeZone: true,
          title: true,
          location: true,
          description: true,
          createdAt: true,
          participantUrlId: true,
          status: true,
          hideParticipants: true,
          disableComments: true,
          hideScores: true,
          requireParticipantEmail: true,
          options: {
            select: {
              id: true,
              startTime: true,
              duration: true,
            },
            orderBy: {
              startTime: "asc",
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              banned: true,
            },
          },
          userId: true,
          deleted: true,
          spaceId: true,
          space: {
            select: {
              name: true,
              image: true,
              tier: true,
              showBranding: true,
              primaryColor: true,
            },
          },
          muted: true,
          scheduledEvent: {
            select: {
              id: true,
              start: true,
              end: true,
              allDay: true,
              status: true,
              invites: {
                select: {
                  id: true,
                  inviteeName: true,
                  inviteeEmail: true,
                  inviteeTimeZone: true,
                  status: true,
                },
              },
            },
          },
        },
        where: {
          id: input.urlId,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }
      const inviteLink = shortUrl(`/invite/${res.id}`);

      const canManage = ctx.user
        ? await canUserManagePoll(ctx.user, res)
        : false;

      const event = res.scheduledEvent
        ? {
            id: res.scheduledEvent.id,
            start: res.scheduledEvent.start,
            duration: res.scheduledEvent.allDay
              ? 0
              : dayjs(res.scheduledEvent.end).diff(
                  dayjs(res.scheduledEvent.start),
                  "minute",
                ),
            attendees: res.scheduledEvent.invites
              .map((invite) => ({
                name: invite.inviteeName,
                email: invite.inviteeEmail,
                status: invite.status,
              }))
              .filter(
                (invite) =>
                  invite.status === "accepted" || invite.status === "tentative",
              ),
            status: res.scheduledEvent.status,
          }
        : null;

      return {
        ...res,
        canManage,
        inviteLink,
        event,
      };
    }),
  book: proProcedure
    .input(
      z.object({
        pollId: z.string(),
        optionId: z.string(),
        notify: z.enum(["none", "all", "attendees"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to book a date for this poll",
        });
      }

      const poll = await prisma.poll.findUnique({
        where: {
          id: input.pollId,
        },
        select: {
          id: true,
          createdAt: true,
          timeZone: true,
          title: true,
          location: true,
          description: true,
          spaceId: true,
          hideParticipants: true,
          space: {
            select: {
              showBranding: true,
              primaryColor: true,
              image: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              locale: true,
              timeFormat: true,
            },
          },
          participants: {
            where: { deleted: false },
            select: {
              id: true,
              name: true,
              email: true,
              locale: true,
              timeZone: true,
              user: {
                select: {
                  email: true,
                  timeZone: true,
                },
              },
              votes: {
                select: {
                  optionId: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!poll) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      if (!poll.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Poll has no user",
        });
      }

      // create event in database
      const option = await prisma.option.findUnique({
        where: {
          id: input.optionId,
        },
        select: {
          startTime: true,
          duration: true,
        },
      });

      if (!option) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Option not found",
        });
      }

      const eventTimes = getScheduledEventTimes({
        startTime: option.startTime,
        duration: option.duration,
        timeZone: poll.timeZone,
      });

      const { spaceId } = poll;

      if (!spaceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Poll has no space",
        });
      }

      const eventId = nanoid();
      const uid = `${eventId}@rallly.co`;

      const attendees = poll.participants.filter((p) =>
        p.votes.some((v) => v.optionId === input.optionId && v.type !== "no"),
      );

      const event = createIcsEvent({
        uid,
        sequence: 0,
        title: poll.title,
        location: poll.location ?? undefined,
        description: poll.description ?? undefined,
        start: eventTimes.start,
        end: eventTimes.end,
        allDay: eventTimes.allDay,
        timeZone: eventTimes.timeZone ?? undefined,
        organizer: {
          name: poll.user.name,
          email: poll.user.email,
        },
      });

      // A poll can have several participants sharing an email; an event holds at
      // most one invite per email, so collapse them, keeping the most committal
      // response (accepted > tentative > declined) so a stale "no" duplicate
      // can't bury an "accepted".
      const inviteStatusByVote = {
        yes: "accepted",
        ifNeedBe: "tentative",
        no: "declined",
      } as const;
      const inviteStatusRank = { accepted: 0, tentative: 1, declined: 2 };
      const invitesByEmail = new Map<
        string,
        {
          uid: string;
          inviteeName: string;
          inviteeEmail: string;
          inviteeTimeZone: string | null | undefined;
          status: (typeof inviteStatusByVote)[keyof typeof inviteStatusByVote];
        }
      >();
      for (const p of poll.participants) {
        if (!p.email) continue;
        const status =
          inviteStatusByVote[
            p.votes.find((v) => v.optionId === input.optionId)?.type ?? "no"
          ];
        const key = p.email.trim().toLowerCase();
        const existing = invitesByEmail.get(key);
        if (
          existing &&
          inviteStatusRank[existing.status] <= inviteStatusRank[status]
        ) {
          continue;
        }
        invitesByEmail.set(key, {
          uid: nanoid(),
          inviteeName: p.name,
          inviteeEmail: p.email,
          inviteeTimeZone: p.user?.timeZone ?? p.timeZone ?? poll.timeZone,
          status,
        });
      }
      const inviteData = Array.from(invitesByEmail.values());

      const scheduledEvent = await prisma.$transaction(async (tx) => {
        // create scheduled event
        const event = await tx.scheduledEvent.create({
          data: {
            id: eventId,
            uid: `${eventId}@rallly.co`,
            start: eventTimes.start,
            end: eventTimes.end,
            title: poll.title,
            description: poll.description,
            location: poll.location
              ? { provider: "custom", address: poll.location }
              : undefined,
            timeZone: eventTimes.timeZone,
            userId: ctx.user.id,
            spaceId,
            allDay: eventTimes.allDay,
            status: "confirmed",
            hideAttendees: poll.hideParticipants,
            invites: {
              createMany: {
                data: inviteData,
              },
            },
          },
        });
        // update poll status
        await tx.poll.update({
          where: {
            id: poll.id,
          },
          data: {
            status: "scheduled",
            closedReason: null,
            scheduledEventId: event.id,
          },
        });

        return event;
      });

      if (event.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: event.error.message,
        });
      }

      if (!event.value) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate ics",
        });
      } else {
        const participantsToEmail: Array<{
          name: string;
          email: string;
          locale: string | undefined;
          timeZone: string | null;
        }> = [];

        if (input.notify === "all") {
          poll.participants.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
                timeZone: p.timeZone,
              });
            }
          });
        }

        if (input.notify === "attendees") {
          attendees.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
                timeZone: p.timeZone,
              });
            }
          });
        }

        const hostEmail = poll.user.email;
        const hostName = poll.user.name;
        const hostLocale = poll.user.locale ?? undefined;

        const { date, day, dow, time } = formatEventDateTime({
          start: scheduledEvent.start,
          end: scheduledEvent.end,
          allDay: scheduledEvent.allDay,
          timeZone: scheduledEvent.timeZone,
          locale: hostLocale,
          timeFormat: poll.user.timeFormat,
        });

        const space = poll.space;
        after(async () =>
          sendFinalizeHostEmail({
            to: hostEmail,
            locale: hostLocale,
            branding: await getInstanceBranding(),
            icalEvent: {
              filename: "invite.ics",
              method: "request",
              content: event.value,
            },
            props: {
              name: hostName,
              pollUrl: absoluteUrl(`/poll/${poll.id}`),
              location: poll.location,
              title: poll.title,
              attendees: poll.participants
                .filter((p) =>
                  p.votes.some(
                    (v) => v.optionId === input.optionId && v.type !== "no",
                  ),
                )
                .map((p) => p.name),
              date,
              day,
              dow,
              time,
            },
          }),
        );

        for (const p of participantsToEmail) {
          const { date, day, dow, time } = formatEventDateTime({
            start: scheduledEvent.start,
            end: scheduledEvent.end,
            allDay: scheduledEvent.allDay,
            timeZone: scheduledEvent.timeZone,
            inviteeTimeZone: p.timeZone,
            locale: p.locale,
          });
          after(async () =>
            sendFinalizeParticipantEmail({
              to: p.email,
              locale: p.locale ?? undefined,
              branding: space
                ? await getSpaceBranding(space)
                : await getInstanceBranding(),
              icalEvent: {
                filename: "invite.ics",
                method: "request",
                content: event.value,
              },
              props: {
                pollUrl: absoluteUrl(`/invite/${poll.id}`),
                title: poll.title,
                hostName: poll.user?.name ?? "",
                date,
                day,
                dow,
                time,
              },
            }),
          );
        }

        posthog()?.capture({
          event: "poll_schedule",
          distinctId: ctx.user.id,
          properties: {
            attendee_count: attendees.length,
            days_since_created: dayjs().diff(poll.createdAt, "day"),
            participant_count: poll.participants.length,
          },
          groups: {
            poll: poll.id,
          },
        });
      }
    }),
  reopen: privateProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to reopen this poll",
        });
      }

      await prisma.$transaction(async () => {
        const poll = await prisma.poll.update({
          where: {
            id: input.pollId,
          },
          data: {
            status: "open",
            closedReason: null,
          },
        });

        if (poll.scheduledEventId) {
          await prisma.scheduledEvent.delete({
            where: {
              id: poll.scheduledEventId,
            },
          });
        }
      });

      posthog()?.capture({
        event: "poll_reopen",
        distinctId: ctx.user.id,
        groups: {
          poll: input.pollId,
        },
      });
    }),
  close: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to close this poll",
        });
      }

      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "closed",
          closedReason: "manual",
        },
      });

      posthog()?.capture({
        event: "poll_close",
        distinctId: ctx.user.id,
        groups: {
          poll: input.pollId,
        },
      });
    }),
  duplicate: proProcedure
    .input(
      z.object({
        pollId: z.string(),
        newTitle: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to duplicate this poll",
        });
      }

      const poll = await prisma.poll.findUnique({
        where: {
          id: input.pollId,
        },
        select: {
          location: true,
          description: true,
          timeZone: true,
          hideParticipants: true,
          hideScores: true,
          requireParticipantEmail: true,
          disableComments: true,
          spaceId: true,
          kind: true,
          options: {
            select: {
              startTime: true,
              duration: true,
            },
          },
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
      }

      const newPoll = await prisma.poll.create({
        select: {
          id: true,
        },
        data: {
          id: nanoid(),
          title: input.newTitle,
          userId: ctx.user.id,
          timeZone: poll.timeZone,
          location: poll.location,
          spaceId: poll.spaceId,
          requireParticipantEmail: poll.requireParticipantEmail,
          description: poll.description,
          hideParticipants: poll.hideParticipants,
          hideScores: poll.hideScores,
          disableComments: poll.disableComments,
          adminUrlId: nanoid(),
          participantUrlId: nanoid(),
          kind: poll.kind,
          options: {
            create: poll.options,
          },
        },
      });

      return newPoll;
    }),
});
