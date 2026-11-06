import * as z from "zod";
import { searchPolls } from "@/features/poll/data";
import { searchScheduledEvents } from "@/features/scheduled-event/data";
import { getEventListStatus } from "@/features/scheduled-event/utils";
import { searchSpaceMembers } from "@/features/space/member/data";
import type { SpaceContentScope, SpaceDTO } from "@/features/space/types";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { router, spaceProcedure } from "../trpc";

const RESULT_LIMIT = 5;
// Above this many entities of any type the client stops filtering locally
// and falls back to server search.
const INDEX_LIMIT = 1000;

const timeZoneSchema = z.string();

async function findSearchItems({
  space,
  scope,
  query,
  limit,
  timeZone,
}: {
  space: Pick<SpaceDTO, "id" | "role">;
  scope: SpaceContentScope;
  query?: string;
  limit: number;
  timeZone: string;
}) {
  // Member results open the members page, which only admins can reach
  const canSearchMembers = space.role === "admin";
  const viewerTimeZone = normalizeTimeZone(timeZone) ?? "UTC";

  const [polls, events, members] = await Promise.all([
    searchPolls({ scope, query, limit }),
    searchScheduledEvents({ scope, query, limit }),
    canSearchMembers
      ? searchSpaceMembers({ spaceId: space.id, query, limit })
      : [],
  ]);

  const now = new Date();

  return {
    polls,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      timeZone: event.timeZone,
      listStatus: getEventListStatus({
        status: event.status,
        allDay: event.allDay,
        end: event.end,
        now,
        timeZone: viewerTimeZone,
      }),
    })),
    members,
  };
}

export const search = router({
  // Everything searchable in the active space, for filtering on the client
  // as the user types. `complete` is false when any type hit the cap; the
  // client then searches on the server instead.
  index: spaceProcedure
    .input(z.object({ timeZone: timeZoneSchema }))
    .query(async ({ ctx, input }) => {
      const items = await findSearchItems({
        space: ctx.space,
        scope: ctx.contentScope,
        limit: INDEX_LIMIT + 1,
        timeZone: input.timeZone,
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
        query: z.string().trim().min(1).max(100),
        // The viewer's zone decides which events tab an event belongs to
        timeZone: timeZoneSchema,
      }),
    )
    .query(({ ctx, input }) =>
      findSearchItems({
        space: ctx.space,
        scope: ctx.contentScope,
        query: input.query,
        limit: RESULT_LIMIT,
        timeZone: input.timeZone,
      }),
    ),
});
