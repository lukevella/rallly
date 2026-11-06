import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { SEARCH_QUERY_MAX_LENGTH } from "@/features/navigation/constants";
import { searchPolls } from "@/features/poll/data";
import { searchScheduledEvents } from "@/features/scheduled-event/data";
import { searchSpaceMembers } from "@/features/space/member/data";
import type { SpaceContentScope, SpaceDTO } from "@/features/space/types";
import { escapeLikePattern } from "@/lib/utils/escape-like-pattern";
import { router, spaceProcedure } from "../trpc";

const RESULT_LIMIT = 5;
// Above this many entities of any type the client stops filtering locally
// and falls back to server search.
const INDEX_LIMIT = 1000;

// The client names the space it expects so cached results can never be
// shown for a space other than the active one.
function assertActiveSpace(space: Pick<SpaceDTO, "id">, spaceId: string) {
  if (space.id !== spaceId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Active space changed",
    });
  }
}

async function findSearchItems({
  space,
  scope,
  query,
  limit,
}: {
  space: Pick<SpaceDTO, "id" | "role">;
  scope: SpaceContentScope;
  query?: string;
  limit: number;
}) {
  // Member results open the members page, which only admins can reach
  const canSearchMembers = space.role === "admin";

  const [polls, events, members] = await Promise.all([
    searchPolls({ scope, query, limit }),
    searchScheduledEvents({ scope, query, limit }),
    canSearchMembers
      ? searchSpaceMembers({ spaceId: space.id, query, limit })
      : [],
  ]);

  return { polls, events, members };
}

export const search = router({
  // Everything searchable in the active space, for filtering on the client
  // as the user types. `complete` is false when any type hit the cap; the
  // client then searches on the server instead.
  index: spaceProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      assertActiveSpace(ctx.space, input.spaceId);
      const items = await findSearchItems({
        space: ctx.space,
        scope: ctx.contentScope,
        limit: INDEX_LIMIT + 1,
      });
      const complete =
        items.polls.length <= INDEX_LIMIT &&
        items.events.length <= INDEX_LIMIT &&
        items.members.length <= INDEX_LIMIT;
      return { ...items, complete };
    }),
  query: spaceProcedure
    .input(
      z.object({
        spaceId: z.string(),
        query: z.string().trim().min(1).max(SEARCH_QUERY_MAX_LENGTH),
      }),
    )
    .query(({ ctx, input }) => {
      assertActiveSpace(ctx.space, input.spaceId);
      return findSearchItems({
        space: ctx.space,
        scope: ctx.contentScope,
        query: escapeLikePattern(input.query),
        limit: RESULT_LIMIT,
      });
    }),
});
