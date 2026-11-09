"use client";

import { posthog } from "@rallly/posthog/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@rallly/ui/command";
import { useDialog } from "@rallly/ui/dialog";
import { keepPreviousData } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { LucideIcon } from "lucide-react";
import {
  BarChart2Icon,
  BellIcon,
  BoltIcon,
  CalendarIcon,
  CreditCardIcon,
  KeyIcon,
  LoaderCircleIcon,
  LockIcon,
  PanelsTopLeftIcon,
  PlusIcon,
  Settings2Icon,
  ShapesIcon,
  UserIcon,
  VideoIcon,
  WebhookIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { CommandMenuContext, useSpaceMenu } from "@/features/navigation/client";
import {
  SEARCH_INDEX_STALE_TIME,
  SEARCH_QUERY_MAX_LENGTH,
} from "@/features/navigation/constants";
import { usePollAdminHref } from "@/features/poll/client";
import { getEventListStatus } from "@/features/scheduled-event/utils";
import { useSpace } from "@/features/space/client";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers";
import { CommandGlobalShortcut } from "./command-global-shortcut";

const SEARCH_DEBOUNCE_MS = 200;
const RESULT_LIMIT = 5;

type NavigationCommand = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

function useSettingsCommands(): NavigationCommand[] {
  const { t } = useTranslation();
  const { data: space } = useSpace();
  const user = useAuthedUser();
  const isCalendarsEnabled = useFeatureFlag("calendars");
  const isConferencingEnabled = useFeatureFlag("conferencing");
  const isEventTypesEnabled = useFeatureFlag("eventTypes");
  const isBillingEnabled = useFeatureFlag("billing");
  const isApiEnabled = useFeatureFlag("api");
  const isWebhooksEnabled = useFeatureFlag("webhooks");
  const isSpaceOwner = space.ownerId === user.id;

  return React.useMemo(
    () => [
      {
        id: "profile",
        label: t("profile", { defaultValue: "Profile" }),
        href: "/settings/profile",
        icon: UserIcon,
      },
      {
        id: "preferences",
        label: t("preferences", { defaultValue: "Preferences" }),
        href: "/settings/preferences",
        icon: Settings2Icon,
      },
      ...(isCalendarsEnabled
        ? [
            {
              id: "calendars",
              label: t("calendars", { defaultValue: "Calendars" }),
              href: "/settings/calendars",
              icon: CalendarIcon,
            },
          ]
        : []),
      ...(isConferencingEnabled
        ? [
            {
              id: "conferencing",
              label: t("conferencing", { defaultValue: "Conferencing" }),
              href: "/settings/conferencing",
              icon: VideoIcon,
            },
          ]
        : []),
      {
        id: "security",
        label: t("security", { defaultValue: "Security" }),
        href: "/settings/security",
        icon: LockIcon,
      },
      {
        id: "notifications",
        label: t("notifications", { defaultValue: "Notifications" }),
        href: "/settings/notifications",
        icon: BellIcon,
      },
      {
        id: "spaces",
        label: t("spaces", { defaultValue: "Spaces" }),
        href: "/settings/spaces",
        icon: PanelsTopLeftIcon,
      },
      {
        id: "general",
        label: t("general", { defaultValue: "General" }),
        href: "/settings/general",
        icon: BoltIcon,
      },
      ...(isEventTypesEnabled
        ? [
            {
              id: "event-types",
              label: t("eventTypes", { defaultValue: "Event Types" }),
              href: "/settings/event-types",
              icon: ShapesIcon,
            },
          ]
        : []),
      ...(isBillingEnabled
        ? [
            {
              id: "billing",
              label: t("billing", { defaultValue: "Billing" }),
              href: "/settings/billing",
              icon: CreditCardIcon,
            },
          ]
        : []),
      ...(isSpaceOwner && isApiEnabled
        ? [
            {
              id: "api-keys",
              label: t("apiKeys", { defaultValue: "API keys" }),
              href: "/settings/api-keys",
              icon: KeyIcon,
            },
            ...(isWebhooksEnabled
              ? [
                  {
                    id: "webhooks",
                    label: t("webhooks", { defaultValue: "Webhooks" }),
                    href: "/settings/webhooks",
                    icon: WebhookIcon,
                  },
                ]
              : []),
          ]
        : []),
    ],
    [
      t,
      isCalendarsEnabled,
      isConferencingEnabled,
      isEventTypesEnabled,
      isBillingEnabled,
      isApiEnabled,
      isWebhooksEnabled,
      isSpaceOwner,
    ],
  );
}

function NavigationCommandLabel({ label }: { label: string }) {
  return (
    <div>
      <Trans
        i18nKey="goTo"
        defaults="Go to <b>{page}</b>"
        values={{ page: label }}
        components={{ b: <b className="font-medium" /> }}
      />
    </div>
  );
}

// Results already matched on the server, so the query rides in the value to
// survive cmdk's client side filter.
function resultValue(type: string, id: string, query: string) {
  return `${type}:${id}:${query}`;
}

type SearchData = inferRouterOutputs<AppRouter>["search"]["query"];

function SearchResults({
  query,
  data,
  onSelect,
}: {
  query: string;
  data: SearchData;
  onSelect: (href: string, type: string) => void;
}) {
  const { formatDateTime } = useDateTime();
  const pollAdminHref = usePollAdminHref();

  return (
    <>
      {data.polls.length > 0 ? (
        <CommandGroup heading={<Trans i18nKey="polls" defaults="Polls" />}>
          {data.polls.map((poll) => (
            <CommandItem
              key={poll.id}
              value={resultValue("poll", poll.id, query)}
              onSelect={() => onSelect(pollAdminHref(poll.id), "poll")}
            >
              <BarChart2Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{poll.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
      {data.events.length > 0 ? (
        <CommandGroup heading={<Trans i18nKey="events" defaults="Events" />}>
          {data.events.map((event) => (
            <CommandItem
              key={event.id}
              value={resultValue("event", event.id, query)}
              onSelect={() =>
                onSelect(
                  `/events?${new URLSearchParams({
                    // Classified on select: the index can outlive an
                    // event's end
                    status: getEventListStatus({
                      status: event.status,
                      allDay: event.allDay,
                      end: new Date(event.end),
                      now: new Date(),
                      timeZone: getBrowserTimeZone(),
                    }),
                    q: event.title,
                  })}`,
                  "event",
                )
              }
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{event.title}</span>
              <CommandShortcut className="tracking-normal">
                {formatDateTime(
                  event.start,
                  "date",
                  // All-day and floating events are wall-clock values stored
                  // as UTC, shown as stored to everyone
                  event.allDay || !event.timeZone
                    ? { timeZone: "UTC" }
                    : undefined,
                )}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
      {data.members.length > 0 ? (
        <CommandGroup heading={<Trans i18nKey="members" defaults="Members" />}>
          {data.members.map((member) => (
            <CommandItem
              key={member.userId}
              value={resultValue("member", member.userId, query)}
              onSelect={() =>
                onSelect(
                  `/members?${new URLSearchParams({ q: member.name })}`,
                  "member",
                )
              }
            >
              <OptimizedAvatarImage
                size="sm"
                name={member.name}
                src={member.image}
              />
              <span className="truncate">{member.name}</span>
              <span className="truncate text-muted-foreground">
                {member.email}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
    </>
  );
}

function matches(text: string, query: string) {
  return text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function filterSearchIndex(index: SearchData, query: string): SearchData {
  return {
    polls: index.polls
      .filter((poll) => matches(poll.title, query))
      .slice(0, RESULT_LIMIT),
    events: index.events
      .filter((event) => matches(event.title, query))
      .slice(0, RESULT_LIMIT),
    members: index.members
      .filter(
        (member) => matches(member.name, query) || matches(member.email, query),
      )
      .slice(0, RESULT_LIMIT),
  };
}

/**
 * Results for the typed query. Filters a prefetched index of the whole space
 * locally, so each keystroke costs no network; falls back to a debounced
 * server search when the index is capped or unavailable.
 */
function useSearchResults({
  query,
  enabled,
}: {
  query: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const { data: space } = useSpace();
  const index = trpc.search.index.useQuery(
    { spaceId: space.id },
    { enabled, staleTime: SEARCH_INDEX_STALE_TIME },
  );
  const isIndexConflict = index.error?.data?.code === "CONFLICT";
  const useServer =
    !isIndexConflict && (index.isError || index.data?.complete === false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const server = trpc.search.query.useQuery(
    { spaceId: space.id, query: debouncedQuery },
    {
      enabled: useServer && debouncedQuery.length > 0,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    },
  );
  // The active space changed elsewhere (another tab). Cached results belong
  // to the old space, so the conflict wins over them and the space resyncs.
  // If the refresh leaves the space unchanged the conflict stands; it then
  // shows as a failure, and reopening the menu retries.
  const isSpaceConflict =
    isIndexConflict || server.error?.data?.code === "CONFLICT";
  const [isRefreshingSpace, startSpaceRefresh] = React.useTransition();
  React.useEffect(() => {
    if (isSpaceConflict) {
      startSpaceRefresh(() => router.refresh());
    }
  }, [isSpaceConflict, router]);

  const localData = React.useMemo(
    () =>
      index.data?.complete && query
        ? filterSearchIndex(index.data, query)
        : undefined,
    [index.data, query],
  );

  if (!query) {
    return { results: undefined, isPending: false, isError: false };
  }

  if (isSpaceConflict) {
    return {
      results: undefined,
      isPending: isRefreshingSpace,
      isError: !isRefreshingSpace,
    };
  }

  if (localData) {
    return {
      results: { query, data: localData },
      isPending: false,
      isError: false,
    };
  }

  if (useServer) {
    const isPending = query !== debouncedQuery || server.isFetching;
    return {
      results:
        debouncedQuery && server.data && !server.isPlaceholderData
          ? { query: debouncedQuery, data: server.data }
          : undefined,
      isPending,
      isError: !isPending && server.isError,
    };
  }

  return {
    results: undefined,
    isPending: index.isPending,
    isError: false,
  };
}

function CommandMenu({
  dialogProps,
  dismiss,
}: {
  dialogProps: ReturnType<typeof useDialog>["dialogProps"];
  dismiss: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { config } = useSpaceMenu();
  const settingsCommands = useSettingsCommands();
  const [search, setSearch] = React.useState("");
  const query = search.trim();
  const {
    results,
    isPending: isSearchPending,
    isError: isSearchError,
  } = useSearchResults({
    query,
    enabled: dialogProps.open,
  });

  const navigationCommands = config.sections.flatMap(
    (section) => section.items,
  );

  const handleSelect = (href: string, type: string) => {
    posthog?.capture("command_menu:item_select", { type });
    router.push(href);
    dismiss();
  };

  // Start each opening from an empty input
  const open = dialogProps.open;
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <CommandDialog
      {...dialogProps}
      title={<Trans i18nKey="commandMenu" defaults="Command menu" />}
      description={
        <Trans i18nKey="commandMenuDescription" defaults="Select a command" />
      }
    >
      <CommandInput
        autoFocus={true}
        value={search}
        onValueChange={setSearch}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        placeholder={t("commandMenuSearchPlaceholder", {
          defaultValue: "Type a command or search...",
        })}
      />
      <CommandList className="max-h-[min(480px,60vh)]">
        <CommandEmpty>
          {isSearchPending ? (
            <LoaderCircleIcon className="mx-auto size-4 animate-spin text-muted-foreground" />
          ) : isSearchError ? (
            <Trans
              i18nKey="commandMenuSearchFailed"
              defaults="Search failed. Try again."
            />
          ) : (
            <Trans i18nKey="commandMenuNoResults" defaults="No results" />
          )}
        </CommandEmpty>
        {results ? (
          <SearchResults
            // cmdk only runs its full filter (items, groups, empty state)
            // when an item mounts; an item kept across queries keeps its
            // stale visibility, so each query mounts a fresh set.
            key={results.query}
            query={results.query}
            data={results.data}
            onSelect={handleSelect}
          />
        ) : null}
        <CommandGroup
          heading={<Trans i18nKey="commandMenuActions" defaults="Actions" />}
        >
          <CommandItem onSelect={() => handleSelect("/new", "action")}>
            <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
            <Trans i18nKey="createNewPoll" defaults="Create new poll" />
          </CommandItem>
        </CommandGroup>
        <CommandGroup
          heading={
            <Trans i18nKey="commandMenuNavigation" defaults="Navigation" />
          }
        >
          {navigationCommands.map((item) => (
            <CommandItem
              key={item.id}
              value={`navigation:${item.id}`}
              keywords={[item.label]}
              onSelect={() => handleSelect(item.href, "navigation")}
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground" />
              <NavigationCommandLabel label={item.label} />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup
          heading={<Trans i18nKey="settings" defaults="Settings" />}
        >
          {settingsCommands.map((item) => (
            <CommandItem
              key={item.id}
              value={`settings:${item.id}`}
              keywords={[item.label]}
              onSelect={() => handleSelect(item.href, "settings")}
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground" />
              <NavigationCommandLabel label={item.label} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function CommandMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { trigger, dismiss, dialogProps } = useDialog();
  // useDialog only refocuses a trigger it holds a ref to, and the menu has
  // several (button, shortcut), so remember whatever had focus on open.
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const isOpen = dialogProps.open;
  const open = React.useCallback(() => {
    if (!isOpen) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    trigger();
  }, [trigger, isOpen]);
  const close = React.useCallback(() => {
    dismiss();
    returnFocusRef.current?.focus();
  }, [dismiss]);
  return (
    <CommandMenuContext.Provider value={{ open }}>
      <CommandGlobalShortcut trigger={open} />
      <CommandMenu
        dialogProps={{
          open: dialogProps.open,
          onOpenChange: (nextOpen) => (nextOpen ? open() : close()),
        }}
        dismiss={close}
      />
      {children}
    </CommandMenuContext.Provider>
  );
}
