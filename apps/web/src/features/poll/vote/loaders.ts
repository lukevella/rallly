import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import {
  getPollDetails,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import {
  countParticipants,
  getOptionScores,
  getViewerResponse,
} from "@/features/poll/vote/data";
import type { VotePageView } from "@/features/poll/vote/types";
import { getSession } from "@/lib/auth";

/**
 * Everything the vote page renders, in one read, with visibility already
 * resolved: a hidden score is absent from the result rather than filtered
 * on the client, and the viewer's single response is chosen here.
 */
export const loadVotePage = cache(
  async ({
    pollId,
    token,
  }: {
    pollId: string;
    token?: string;
  }): Promise<VotePageView> => {
    const poll = await getPollDetails({ pollId });

    if (!poll) {
      notFound();
    }

    const [session, participantIds] = await Promise.all([
      getSession(),
      token ? listParticipantIdsByToken({ pollId, token }) : [],
    ]);

    const userId = session?.user?.id;

    const [response, scores, participantCount] = await Promise.all([
      getViewerResponse({ pollId, userId, participantIds }),
      // Scores stay hidden until the viewer has responded, so they are not
      // read at all when they cannot be shown.
      poll.hideScores && !userId && participantIds.length === 0
        ? null
        : getOptionScores({ pollId }),
      countParticipants({ pollId }),
    ]);

    // hideScores reveals the tally only once the viewer has responded.
    const scoresVisible = !poll.hideScores || response !== null;

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        location: poll.location,
        status: poll.status,
        closedReason: poll.closedReason,
        allowTentativeVotes: poll.allowTentativeVotes,
        timeZone: poll.timeZone,
        userId: poll.userId,
        spaceId: poll.spaceId,
        requireParticipantEmail: poll.requireParticipantEmail,
        user: poll.user ? { name: poll.user.name } : null,
        space: poll.space
          ? {
              name: poll.space.name,
              image: poll.space.image,
              showBranding: poll.space.showBranding,
              hideAttribution: poll.space.hideAttribution,
              primaryColor: poll.space.primaryColor,
            }
          : null,
        event: poll.event
          ? {
              id: poll.event.id,
              start: poll.event.start,
              duration: poll.event.duration,
            }
          : null,
      },
      participantCount: scoresVisible ? participantCount : null,
      results: poll.options.map((option) => ({
        optionId: option.id,
        startTime: option.startTime,
        duration: option.duration,
        score:
          scoresVisible && scores
            ? (scores.get(option.id) ?? { yes: 0, ifNeedBe: 0 })
            : null,
      })),
      response,
      canVote: poll.status === "open",
    };
  },
);
