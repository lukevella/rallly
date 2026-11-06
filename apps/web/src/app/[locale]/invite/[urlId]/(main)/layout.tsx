import { Suspense } from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Link } from "@/components/link";
import { Spinner } from "@/components/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandStyle } from "@/features/branding/components/brand-style";
import { Logo } from "@/features/branding/components/logo";
import { loadPollCommentCount, loadPollDetails } from "@/features/poll/loaders";
import { TimeFormatSwitcher } from "@/features/poll/vote/components/time-format-switcher";
import { loadCanManagePoll } from "@/features/poll/vote/loaders";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { getTranslation } from "@/i18n/server";
import { getLocale } from "@/i18n/server/get-locale";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { InviteHeader } from "./components/invite-header";
import { InviteNavLinks } from "./components/invite-nav-links";
import { ManagePollLink } from "./components/manage-poll-link";
import { TimeZonePicker } from "./components/time-zone-picker";

// The switcher is drawn for white surfaces; on the gray header its
// border needs more contrast in light mode.
const onGray = "border-gray-300 dark:border-input";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ urlId: string }>;
};

type NavPoll = NonNullable<Awaited<ReturnType<typeof loadPollDetails>>>;

function getNavState(poll: NavPoll) {
  // A date poll has no times to format, and a poll without a time zone
  // shows its times as written, to everyone.
  const hasTimes = poll.options.some((option) => option.duration > 0);
  return {
    space: poll.space?.showBranding ? poll.space : null,
    hasTimes,
    hasTimeZone: hasTimes && poll.timeZone !== null,
  };
}

/**
 * The space's logo and name when its branding is active, otherwise the
 * instance logo, then the tabs, the viewer's clock preferences and the theme
 * toggle in the top right.
 */
function InviteNav({
  poll,
  commentCount,
  canManage,
}: {
  poll: NavPoll;
  commentCount?: number;
  canManage: boolean;
}) {
  const { space, hasTimes, hasTimeZone } = getNavState(poll);

  return (
    <InviteHeader className="px-3 lg:px-6">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-x-2 sm:gap-x-6">
        {space ? (
          <div className="flex shrink-0 items-center gap-x-2.5 lg:min-w-0 lg:shrink">
            <SpaceIcon
              name={space.name}
              src={space.image ?? undefined}
              size="lg"
              // Steps down to 32px once the header sticks.
              className="transition-[width,height] duration-200 ease-out group-data-scrolled/header:size-8 max-sm:size-8"
            />
            <span className="hidden truncate font-medium text-sm lg:inline">
              {space.name}
            </span>
          </div>
        ) : (
          <Logo size="sm" />
        )}
        <InviteNavLinks
          pollId={poll.id}
          showComments={!poll.disableComments}
          commentCount={commentCount}
        />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {hasTimeZone ? <TimeZonePicker showTimeFormat={hasTimes} /> : null}
          {hasTimes ? (
            // Below sm it moves into the time zone dialog, when there is one.
            <div className={hasTimeZone ? "hidden sm:block" : undefined}>
              <TimeFormatSwitcher className={onGray} />
            </div>
          ) : null}
          <ThemeToggle />
          {canManage ? (
            // Below sm the manager banner already links to the admin page.
            <div className="hidden items-center gap-1 sm:flex">
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <ManagePollLink pollId={poll.id} />
            </div>
          ) : null}
        </div>
      </div>
    </InviteHeader>
  );
}

/** Tells someone who can manage the poll that this is the participant view. */
async function ManagerNotice({ pollId }: { pollId: string }) {
  const { t, i18n } = await getTranslation();
  return (
    <div className="flex items-center justify-center gap-x-3 bg-primary px-3 py-2 text-primary-foreground text-sm">
      <span>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="invitePageManagerNotice"
          defaults="You're viewing this poll as a participant"
        />
      </span>
      <Link
        href={`/poll/${pollId}`}
        className="font-medium underline decoration-primary-foreground/50 underline-offset-2 transition-colors hover:decoration-primary-foreground"
      >
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="invitePageManagerNoticeManage"
          defaults="Manage"
        />
      </Link>
    </div>
  );
}

/**
 * The device clock settings are provided here rather than per page, so the
 * time format picked in the header reaches the poll beneath it. Nothing
 * renders in the header for a poll that is missing or unavailable: the page
 * shows its own notice for those.
 */
async function InviteFrame({ params, children }: LayoutProps) {
  const { urlId } = await params;
  const [poll, locale, deviceDateTimeConfig, canManage, commentCount] =
    await Promise.all([
      loadPollDetails(urlId),
      getLocale(),
      getDeviceDateTimeConfig(),
      loadCanManagePoll(urlId),
      loadPollCommentCount(urlId),
    ]);

  // Each viewer sees only their own comments when participants are hidden,
  // so the total would leak.
  const visibleCommentCount = poll?.hideParticipants ? undefined : commentCount;

  return (
    <DeviceDateTimeProvider
      locale={locale}
      timeZone={deviceDateTimeConfig.timeZone}
      timeFormat={deviceDateTimeConfig.timeFormat}
    >
      {/* Every tab, not just the poll, takes the space's brand color. Null
          unless the space's branding is active. */}
      {poll?.space?.primaryColor ? (
        <BrandStyle primaryColor={poll.space.primaryColor} />
      ) : null}
      {poll && canManage ? <ManagerNotice pollId={poll.id} /> : null}
      {poll ? (
        <InviteNav
          poll={poll}
          commentCount={visibleCommentCount}
          canManage={canManage}
        />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </DeviceDateTimeProvider>
  );
}

export default function Layout({ children, params }: LayoutProps) {
  return (
    // A page that marks itself data-fill-viewport (the vote tab) gets a
    // fixed height on large screens so its content scrolls inside instead.
    <div className="page-bg-gray-100 flex min-h-dvh flex-col lg:has-[[data-fill-viewport]]:h-dvh lg:has-[[data-fill-viewport]]:overflow-hidden dark:bg-gray-900">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <InviteFrame params={params}>{children}</InviteFrame>
      </Suspense>
    </div>
  );
}
