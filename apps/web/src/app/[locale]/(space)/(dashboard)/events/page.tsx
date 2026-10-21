import type { Metadata } from "next";
import { loadActiveSpace, loadEvents } from "@/features/space/loaders";
import { loadSpaceMembers } from "@/features/space/member/loaders";
import { getTranslation } from "@/i18n/server";
import { EventsList } from "./events-list";
import { EventsEmptyState, EventsPage } from "./events-page";
import { eventsSearchParamsSchema } from "./schema";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [space, searchParams] = await Promise.all([
    loadActiveSpace(),
    props.searchParams,
  ]);
  const { status, q, member, page, pageSize } =
    eventsSearchParamsSchema.parse(searchParams);
  // Ignore a member URL param when the filter is hidden — a bookmarked
  // ?member= URL would otherwise show an empty list with no visible
  // control to clear it.
  const visibleMember = space.shared ? member : undefined;

  const [members, result] = await Promise.all([
    loadSpaceMembers(),
    loadEvents({ status, q, member: visibleMember, page, pageSize }),
  ]);

  return (
    <EventsPage
      members={members.map(({ userId, name, image }) => ({
        userId,
        name,
        image,
      }))}
      list={
        <EventsList
          events={result.events.map((event) => ({
            id: event.id,
            title: event.title,
            status: event.status,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            timeZone: event.timeZone,
            conferencing: event.conferencing,
            createdBy: event.createdBy,
            attendeeCount: event.invites.length,
          }))}
          emptyState={<EventsEmptyState status={status} />}
        />
      }
      page={page}
      hasNextPage={result.hasNextPage}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("events", {
      defaultValue: "Events",
    }),
  };
}
