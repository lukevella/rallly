import "server-only";

import { cache } from "react";
import { listParticipantIdsByToken } from "@/features/poll/data";
import { getSession } from "@/lib/auth";
import { getBallotSource } from "./data";
import { projectBallot } from "./utils";

/**
 * The invite ballot as the current viewer may see it. The shared read is
 * viewer independent; who is looking (session, emailed link token) is
 * resolved here, outside anything that will be cached.
 */
export const loadInviteBallot = cache(
  async ({ pollId, token }: { pollId: string; token?: string }) => {
    const [source, session, linkedResponseIds] = await Promise.all([
      getBallotSource({ pollId }),
      getSession(),
      token ? listParticipantIdsByToken({ pollId, token }) : [],
    ]);

    if (!source) {
      return null;
    }

    return projectBallot({
      source,
      viewer: { userId: session?.user.id ?? null, linkedResponseIds },
    });
  },
);
