import "server-only";

import { cache } from "react";
import {
  listParticipantIdsByProvenEmail,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import { getSession } from "@/lib/auth";
import { getBallotSource } from "./data";
import { projectBallot } from "./utils";

/**
 * The invite ballot as the current viewer may see it. The shared read is
 * viewer independent; who is looking (session, emailed link token, proven
 * email) is resolved here, outside anything that will be cached.
 */
export const loadInviteBallot = cache(
  async (pollId: string, token?: string) => {
    const sessionRead = getSession();
    const [source, session, linkedResponseIds, emailResponseIds] =
      await Promise.all([
        getBallotSource({ pollId }),
        sessionRead,
        token ? listParticipantIdsByToken({ pollId, token }) : [],
        sessionRead.then((session) =>
          session && !session.user.isGuest
            ? listParticipantIdsByProvenEmail({
                pollId,
                userId: session.user.id,
              })
            : [],
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
        emailResponseIds,
      },
    });
  },
);
