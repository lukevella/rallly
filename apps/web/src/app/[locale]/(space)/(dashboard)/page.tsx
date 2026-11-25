import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";
import { loadOptionalOpenPollUsage } from "@/features/poll/limit/loaders";
import {
  loadLastOpenPollActivityAt,
  loadPollStatusCounts,
} from "@/features/poll/loaders";
import { EventsList } from "@/features/scheduled-event/components/events-list";
import { toEventRow } from "@/features/scheduled-event/utils";
import { loadActiveSpace, loadEvents } from "@/features/space/loaders";
import { loadSpaceMembers } from "@/features/space/member/loaders";
import { loadUser, loadUserHasNoAccounts } from "@/features/user/loaders";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { TodayDate } from "./components/today-date";
import { HomeCards } from "./home-cards";
import { EventsEmptyState, HomePage } from "./home-page";
import { eventsSearchParamsSchema } from "./schema";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [user, space, searchParams, { t, i18n }] = await Promise.all([
    loadUser(),
    loadActiveSpace(),
    props.searchParams,
    getTranslation(),
  ]);
  const { status, q, member, page, pageSize } =
    eventsSearchParamsSchema.parse(searchParams);
  // Ignore a member URL param when the filter is hidden — a bookmarked
  // ?member= URL would otherwise show an empty list with no visible
  // control to clear it.
  const visibleMember = space.shared ? member : undefined;

  // The card shows the next upcoming event and how many there are, whatever
  // the list is filtered to. On the default view the list already holds both.
  const listIsUpcoming =
    status === "upcoming" && !q && !visibleMember && page === 1;

  const [
    members,
    result,
    upcoming,
    pollStatusCounts,
    openPollUsage,
    lastPollActivityAt,
    hasNoAccounts,
  ] = await Promise.all([
    loadSpaceMembers(),
    loadEvents({ status, q, member: visibleMember, page, pageSize }),
    listIsUpcoming
      ? null
      : loadEvents({ status: "upcoming", page: 1, pageSize: 1 }),
    loadPollStatusCounts(),
    loadOptionalOpenPollUsage(),
    loadLastOpenPollActivityAt(),
    loadUserHasNoAccounts(),
  ]);
  const upcomingSource = upcoming ?? result;

  const name = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <HomePage
      title={
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="homeGreeting"
          defaults="Hello, {name}!"
          values={{ name }}
        />
      }
      subtitle={
        <TodayDate className="px-4 pt-1 text-muted-foreground text-sm" />
      }
      cards={
        <HomeCards
          openPollCount={pollStatusCounts.open}
          openPollUsage={openPollUsage}
          lastPollActivityAt={lastPollActivityAt}
          upcomingEventCount={upcomingSource.total}
          nextEvent={upcomingSource.events[0] ?? null}
          showPasswordSetup={hasNoAccounts && isFeatureEnabled("emailLogin")}
        />
      }
      members={members.map(({ userId, name, image }) => ({
        userId,
        name,
        image,
      }))}
      list={
        <EventsList
          events={result.events.map(toEventRow)}
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
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
