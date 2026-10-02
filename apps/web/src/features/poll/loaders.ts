import "server-only";

import { shortUrl } from "@rallly/utils/absolute-url";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { listPollActivity } from "@/features/activity/data";
import { loadConferencingOptions } from "@/features/conferencing/loaders";
import {
  canUserManagePoll,
  getPoll,
  getPollAvailability,
  getPollDetails,
  getPollResults,
  getPollStatusCounts,
  listParticipantIdsByToken,
  listPollComments,
  listPollParticipants,
} from "@/features/poll/data";
import { getPollInvitePath } from "@/features/poll/invite/utils";
import {
  filterCommentsForViewer,
  maskParticipantsForViewer,
} from "@/features/poll/utils";
import { loadActiveSpaceContentScope } from "@/features/space/loaders";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";

export const loadPollStatusCounts = cache(async () => {
  const scope = await loadActiveSpaceContentScope();
  return getPollStatusCounts({ scope });
});

export const loadPoll = cache(async (pollId: string) => {
  const scope = await loadActiveSpaceContentScope();
  const poll = await getPoll({ pollId, scope });

  if (!poll) {
    notFound();
  }

  return poll;
});

// Responses for the poll admin pages. loadPoll proves the poll is in the
// viewer's space before any response is read; one read of the full rows per
// request is shared by the list and the detail.
const loadParticipantRows = cache(async (pollId: string) => {
  await loadPoll(pollId);
  return listPollParticipants({ pollId });
});

// The link from the response's confirmation email, for the host to hand to
// a respondent who lost it.
const getEditUrl = ({ pollId, token }: { pollId: string; token: string }) =>
  shortUrl(getPollInvitePath({ pollId, token }));

export const loadPollParticipants = cache(async (pollId: string) => {
  const participants = await loadParticipantRows(pollId);
  return participants.map(({ id, name, note, image, createdAt, token }) => ({
    id,
    name,
    note,
    image,
    createdAt,
    editUrl: getEditUrl({ pollId, token }),
  }));
});

/**
 * One response with its votes, or null when it no longer exists (e.g. it
 * was deleted while its link stayed open).
 */
export const loadOptionalPollResponse = cache(
  async (pollId: string, participantId: string) => {
    const participants = await loadParticipantRows(pollId);
    const participant = participants.find(({ id }) => id === participantId);

    if (!participant) {
      return null;
    }

    const { token, userId: _userId, ...rest } = participant;
    return { ...rest, editUrl: getEditUrl({ pollId, token }) };
  },
);

/**
 * Every option with its vote counts, in date order.
 */
export const loadPollResults = cache(async (pollId: string) => {
  const [scope] = await Promise.all([
    loadActiveSpaceContentScope(),
    loadPoll(pollId),
  ]);
  const results = await getPollResults({ pollId, spaceId: scope.spaceId });

  if (!results) {
    notFound();
  }

  return results;
});

/**
 * The poll's most popular options, best first. Options nobody can attend are
 * left out, so a poll without votes has none.
 */
export const loadPollTopOptions = cache(
  async (pollId: string, limit: number) => {
    const results = await loadPollResults(pollId);
    return {
      participantCount: results.participantCount,
      options: results.options
        .filter((option) => option.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score || a.startTime.getTime() - b.startTime.getTime(),
        )
        .slice(0, limit),
    };
  },
);

export const loadPollActivity = cache(
  async (pollId: string, limit?: number) => {
    const [scope] = await Promise.all([
      loadActiveSpaceContentScope(),
      loadPoll(pollId),
    ]);
    return listPollActivity({ pollId, spaceId: scope.spaceId, limit });
  },
);

export const loadPollResponseActivity = cache(
  async (pollId: string, participantId: string) => {
    const [scope] = await Promise.all([
      loadActiveSpaceContentScope(),
      loadPoll(pollId),
    ]);
    return listPollActivity({
      pollId,
      spaceId: scope.spaceId,
      participantId,
    });
  },
);

/**
 * The token from the emailed link is its own proof of scope: no session is
 * consulted, so a forwarded link acts for the response it names.
 */
export const loadParticipantIdsByToken = cache(
  async (pollId: string, token: string) =>
    listParticipantIdsByToken({ pollId, token }),
);

export const loadPollAvailability = cache(async (pollId: string) =>
  getPollAvailability({ pollId }),
);

/**
 * The poll as a participant sees it. Deliberately no admin check: the
 * invite page is the participant view, and the host reads the full list on
 * the admin page. The emailed link names the viewer's own response, so a
 * guest still sees it as theirs when opening the link in a fresh browser.
 */
export const loadInvitePoll = cache(
  async ({ pollId, token }: { pollId: string; token?: string }) => {
    const poll = await getPollDetails({ pollId });

    if (!poll) {
      notFound();
    }

    const [session, participants, comments, linkedParticipantIds] =
      await Promise.all([
        getSession(),
        listPollParticipants({ pollId }),
        listPollComments({ pollId }),
        token ? listParticipantIdsByToken({ pollId, token }) : [],
      ]);

    const user = session?.user ?? null;
    const viewer = { userId: user?.id ?? null, linkedParticipantIds };

    return {
      poll,
      participants: maskParticipantsForViewer({
        participants,
        viewer,
        hideParticipants: poll.hideParticipants,
      }),
      comments: filterCommentsForViewer({
        comments,
        viewerUserId: viewer.userId,
        hideParticipants: poll.hideParticipants,
      }),
      linkedParticipantIds,
      user,
    };
  },
);

/**
 * The poll as its host sees it: every response with its note and edit link,
 * every comment. Access is proven once here, so nothing downstream checks
 * again. Anyone else lands on the invite page, the same place a guest does.
 */
export const loadAdminPoll = cache(async (pollId: string) => {
  const poll = await getPollDetails({ pollId });

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
  return loadConferencingOptions({
    userId: host?.id ?? null,
    email: host?.email ?? null,
  });
});
