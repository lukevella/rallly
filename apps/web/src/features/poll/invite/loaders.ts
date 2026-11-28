import "server-only";

import { cache } from "react";
import {
  getResponseEmailProof,
  listParticipantIdsByEmail,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import { getSession, getUserIdIfLoggedIn } from "@/lib/auth";
import { getBallotSource } from "./data";
import { projectBallot } from "./utils";

async function listEmailResponseIds(pollId: string) {
  const userId = await getUserIdIfLoggedIn();
  const email = userId ? await getResponseEmailProof(userId) : null;
  return email ? listParticipantIdsByEmail({ pollId, email }) : [];
}

/**
 * The invite ballot as the current viewer may see it. The shared read is
 * viewer independent; who is looking (session, emailed link token, proven
 * email) is resolved here, outside anything that will be cached.
 */
export const loadInviteBallot = cache(
  async (pollId: string, token?: string) => {
    const [source, session, linkedResponseIds, emailResponseIds] =
      await Promise.all([
        getBallotSource({ pollId }),
        getSession(),
        token ? listParticipantIdsByToken({ pollId, token }) : [],
        listEmailResponseIds(pollId),
      ]);

    if (!source) {
      return null;
    }

    return projectBallot({
      source,
      viewer: {
        userId: session?.user.id ?? null,
        linkedResponseIds,
        emailResponseIds,
      },
    });
  },
);
