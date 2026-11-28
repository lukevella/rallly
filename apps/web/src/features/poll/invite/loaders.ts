import "server-only";

import { cache } from "react";
import { listParticipantIdsByTokens } from "@/features/poll/data";
import { loadVoterTokens } from "@/features/poll/participant/loaders";
import { getSession } from "@/lib/auth";
import { getBallotSource } from "./data";
import { projectBallot } from "./utils";

/**
 * The invite ballot as the current viewer may see it. The shared read is
 * viewer independent; who is looking (session, emailed link token, the
 * tokens the browser remembers for this poll) is resolved here, outside
 * anything that will be cached.
 */
export const loadInviteBallot = cache(
  async (pollId: string, token?: string) => {
    const [source, session, voterTokens] = await Promise.all([
      getBallotSource({ pollId }),
      getSession(),
      loadVoterTokens(pollId),
    ]);

    if (!source) {
      return null;
    }

    const [linkedResponseIds, rememberedResponseIds] = await Promise.all([
      token ? listParticipantIdsByTokens({ pollId, tokens: [token] }) : [],
      listParticipantIdsByTokens({ pollId, tokens: voterTokens }),
    ]);

    return projectBallot({
      source,
      viewer: {
        userId: session?.user.id ?? null,
        linkedResponseIds,
        rememberedResponseIds,
      },
    });
  },
);
