import "server-only";

import { shortUrl } from "@rallly/utils/absolute-url";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { listPollActivity } from "@/features/activity/data";
import { loadConferencingOptions } from "@/features/conferencing/loaders";
import {
  canUserManagePoll,
  getLastOpenPollActivityAt,
  getPoll,
  getPollStatusCounts,
  getPolls,
  getPollWithAvailability,
  listParticipantIdsByToken,
  listPollComments,
  listPollParticipants,
} from "@/features/poll/data";
import { getPollInvitePath } from "@/features/poll/invite/utils";
import type { PollStatus } from "@/features/poll/schema";
import { loadActiveSpaceContentScope } from "@/features/space/loaders";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";

export const loadPolls = cache(
  async ({
    status,
    q,
    member,
    page,
    pageSize,
  }: {
    status: PollStatus;
    q?: string;
    member?: string;
    page: number;
    pageSize: number;
  }) => {
    const scope = await loadActiveSpaceContentScope();
    return getPolls({ status, q, member, page, pageSize, scope });
  },
);

export const loadPollStatusCounts = cache(async () => {
  const scope = await loadActiveSpaceContentScope();
  return getPollStatusCounts({ scope });
});

export const loadLastOpenPollActivityAt = cache(async () => {
  const scope = await loadActiveSpaceContentScope();
  return getLastOpenPollActivityAt({ scope });
});

export const loadPoll = cache(async (pollId: string) => {
  const scope = await loadActiveSpaceContentScope();
  const poll = await getPoll({ pollId, scope });

  if (!poll) {
    notFound();
  }

  return poll;
});

/**
 * The token from the emailed link is its own proof of scope: no session is
 * consulted, so a forwarded link acts for the response it names.
 */
export const loadParticipantIdsByToken = cache(
  async (pollId: string, token: string) =>
    listParticipantIdsByToken({ pollId, token }),
);

// One read of the poll row per request, shared by availability and details.
const loadPollWithAvailability = cache(async (pollId: string) =>
  getPollWithAvailability({ pollId }),
);

export const loadPollAvailability = cache(async (pollId: string) => {
  const poll = await loadPollWithAvailability(pollId);
  return poll?.availability ?? null;
});

/**
 * The poll's public details, without its responses. Null for a missing,
 * deleted or removed poll.
 */
export const loadPollDetails = cache(async (pollId: string) => {
  const poll = await loadPollWithAvailability(pollId);
  return poll?.details ?? null;
});

/**
 * The poll as its host sees it: every response with its note and edit link,
 * every comment. Access is proven once here, so nothing downstream checks
 * again. Anyone else lands on the invite page, the same place a guest does.
 */
export const loadAdminPoll = cache(async (pollId: string) => {
  const poll = await loadPollDetails(pollId);

  if (!poll) {
    notFound();
  }

  const session = await getSession();
  const user = session?.user;

  if (!user || !(await canUserManagePoll(user, poll))) {
    redirect(`/invite/${pollId}`);
  }

  const [participants, comments] = await Promise.all([
    listPollParticipants({ pollId }),
    listPollComments({ pollId }),
  ]);

  return {
    poll,
    // The host gets each response's edit link, the one its confirmation
    // email carried, to hand to a respondent who left no email. Built from
    // the same path so the two can never diverge.
    participants: participants.map(({ token, ...participant }) => ({
      ...participant,
      hidden: false,
      editUrl: shortUrl(getPollInvitePath({ pollId, token })),
    })),
    comments,
    user,
  };
});

// The meeting is minted from the poll owner's account at booking, whoever
// edits the poll, so the form offers what the owner can use.
export const loadPollConferencingOptions = cache(async (pollId: string) => {
  const { poll } = await loadAdminPoll(pollId);
  const owner = poll.userId ? await getUser(poll.userId) : null;
  const host = owner && !owner.isGuest ? owner : null;
  return loadConferencingOptions({ userId: host?.id ?? null });
});

export const loadPollActivity = cache(
  async (pollId: string, limit?: number) => {
    const [scope] = await Promise.all([
      loadActiveSpaceContentScope(),
      loadPoll(pollId),
    ]);
    return listPollActivity({ pollId, spaceId: scope.spaceId, limit });
  },
);
