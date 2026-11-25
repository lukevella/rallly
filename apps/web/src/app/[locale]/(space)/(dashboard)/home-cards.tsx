import { buttonVariants, cn } from "@rallly/ui";
import type { LucideIcon } from "lucide-react";
import { ArrowRightIcon, BarChart2Icon, CalendarIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Link } from "@/components/link";
import {
  StatCard,
  StatCardFooter,
  StatCardHeader,
  StatCardLabel,
  StatCardStack,
  StatCardValue,
} from "@/components/stat-card";
import type { OpenPollUsage } from "@/features/poll/limit/types";
import type { EventRow } from "@/features/scheduled-event/types";
import { getTranslation } from "@/i18n/server";
import { NextEventDetail } from "./components/next-event-detail";
import { RecentPollActivity } from "./components/recent-poll-activity";
import { PasswordSetupAlert } from "./password-setup-alert";

// Each card carries its page's color as a tinted icon, kept pale so the
// space icon stays the brightest thing.
const PALETTE = {
  violet: {
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  sky: {
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};

export async function HomeCards({
  openPollCount,
  openPollUsage,
  lastPollActivityAt,
  upcomingEventCount,
  nextEvent,
  showPasswordSetup,
}: {
  openPollCount: number;
  /** The organizer's own usage, which replaces the space-wide count while a limit applies */
  openPollUsage: OpenPollUsage | null;
  lastPollActivityAt: Date | null;
  upcomingEventCount: number;
  nextEvent: Pick<EventRow, "start" | "allDay" | "timeZone"> | null;
  showPasswordSetup: boolean;
}) {
  const { t, i18n } = await getTranslation();

  const openCount =
    openPollUsage?.limit != null ? openPollUsage.openCount : openPollCount;

  const cards = [
    {
      id: "polls",
      icon: BarChart2Icon,
      color: "violet" as const,
      label: (
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="homeOpenPolls"
          defaults="Open polls"
        />
      ),
      value:
        openPollUsage?.limit != null ? (
          <>
            {openPollUsage.openCount}
            <span className="font-normal text-base text-muted-foreground">
              /{openPollUsage.limit}
            </span>
          </>
        ) : (
          openPollCount
        ),
      detail: lastPollActivityAt ? (
        <RecentPollActivity value={lastPollActivityAt} />
      ) : null,
      action:
        openCount > 0 ? (
          <Link href="/polls" className={buttonVariants({ size: "sm" })}>
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="homeViewPolls"
              defaults="View polls"
            />
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : null,
    },
    {
      id: "events",
      icon: CalendarIcon,
      color: "sky" as const,
      label: (
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="upcomingEvents"
          defaults="Upcoming events"
        />
      ),
      value: upcomingEventCount,
      action: null,
      detail: nextEvent ? (
        <NextEventDetail
          start={nextEvent.start}
          allDay={nextEvent.allDay}
          timeZone={nextEvent.timeZone}
        />
      ) : null,
    },
  ] satisfies {
    id: string;
    icon: LucideIcon;
    color: keyof typeof PALETTE;
    action: React.ReactNode;
    label: React.ReactNode;
    value: React.ReactNode;
    detail: React.ReactNode;
  }[];

  return (
    <div className="space-y-6 px-4 pt-3">
      {showPasswordSetup ? <PasswordSetupAlert /> : null}
      <StatCardStack>
        {cards.map((card) => {
          const palette = PALETTE[card.color];
          return (
            <StatCard key={card.id}>
              <StatCardHeader>
                <StatCardLabel className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                      palette.chip,
                    )}
                  >
                    <card.icon />
                  </span>
                  <span className="truncate">{card.label}</span>
                </StatCardLabel>
                {/* Beside the label from sm; below the number on phones,
                    where a narrow card can't fit both on one line */}
                <div className="max-sm:hidden">{card.detail}</div>
              </StatCardHeader>
              <StatCardFooter>
                <div className="min-w-0">
                  <StatCardValue>{card.value}</StatCardValue>
                  <div className="sm:hidden">{card.detail}</div>
                </div>
                {card.action}
              </StatCardFooter>
            </StatCard>
          );
        })}
      </StatCardStack>
    </div>
  );
}
