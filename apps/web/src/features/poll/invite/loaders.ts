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
    const [source, session, linkedResponseIds, rememberedResponseIds] =
      await Promise.all([
        getBallotSource({ pollId }),
        getSession(),
        token ? listParticipantIdsByTokens({ pollId, tokens: [token] }) : [],
        // The link's token is usually in the cookie too; it is read once.
        loadVoterTokens(pollId).then((voterTokens) =>
          listParticipantIdsByTokens({
            pollId,
            tokens: voterTokens.filter((voterToken) => voterToken !== token),
          }),
        ),
      ]);

    if (!source) {
      return null;
    }

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
