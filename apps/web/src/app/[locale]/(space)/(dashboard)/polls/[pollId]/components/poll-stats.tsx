import { cn } from "@rallly/ui";
import { MailIcon, UsersIcon } from "lucide-react";
import {
  StatCard,
  StatCardFooter,
  StatCardHeader,
  StatCardLabel,
  StatCardStack,
  StatCardValue,
} from "@/components/stat-card";
import { Trans } from "@/i18n/client";

function StatIcon({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Responses so far and how many of the invited have answered, as cards. */
export function PollStats({
  responseCount,
  invitedCount,
  respondedInviteCount,
  inviteeAction,
}: {
  responseCount: number;
  invitedCount: number;
  respondedInviteCount: number;
  /** Sits in the invitees card's top right corner. */
  inviteeAction?: React.ReactNode;
}) {
  return (
    <StatCardStack>
      <StatCard>
        <StatCardHeader>
          <StatCardLabel className="flex min-w-0 items-center gap-2">
            <StatIcon className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <UsersIcon />
            </StatIcon>
            <span className="truncate">
              <Trans i18nKey="pollStatsResponses" defaults="Responses" />
            </span>
          </StatCardLabel>
        </StatCardHeader>
        <StatCardFooter>
          <StatCardValue>{responseCount}</StatCardValue>
        </StatCardFooter>
      </StatCard>
      <StatCard>
        <StatCardHeader>
          <StatCardLabel className="flex min-w-0 items-center gap-2">
            <StatIcon className="bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <MailIcon />
            </StatIcon>
            <span className="truncate">
              <Trans i18nKey="pollStatsInvitees" defaults="Invitees" />
            </span>
          </StatCardLabel>
          {inviteeAction}
        </StatCardHeader>
        <StatCardFooter className="items-center">
          <StatCardValue>
            {respondedInviteCount}
            <span className="font-normal text-base text-muted-foreground">
              /{invitedCount}
            </span>
          </StatCardValue>
          <ProgressDonut value={respondedInviteCount} max={invitedCount} />
        </StatCardFooter>
      </StatCard>
    </StatCardStack>
  );
}

/** How many of the invited have responded, as a ring. */
function ProgressDonut({ value, max }: { value: number; max: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? value / max : 0;
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="size-8 shrink-0 -rotate-90"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        strokeWidth="6"
        className="stroke-foreground/10"
      />
      {fraction > 0 ? (
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="stroke-green-500"
        />
      ) : null}
    </svg>
  );
}
