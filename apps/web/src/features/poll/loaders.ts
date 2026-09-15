import "server-only";

import { shortUrl } from "@rallly/utils/absolute-url";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import {
  canUserManagePoll,
  getPoll,
  getPollAvailability,
  getPollDetails,
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
import { getActiveSpaceContentScope } from "@/features/space/loaders";
import { getSession } from "@/lib/auth";

export const loadPollStatusCounts = cache(async () => {
  const scope = await getActiveSpaceContentScope();
  return getPollStatusCounts({ scope });
});

export const loadPoll = cache(async (pollId: string) => {
  const scope = await getActiveSpaceContentScope();
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
