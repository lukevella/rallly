"use client";
import { buttonVariants } from "@rallly/ui";
import { ArrowUpRightIcon, EyeIcon } from "lucide-react";
import { Link } from "@/components/link";
import { Spinner } from "@/components/spinner";
import { useOidcVoting } from "@/features/poll/client";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { PollPageShell } from "@/features/poll/components/poll-page-shell";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { FloatingComments } from "@/features/poll/invite/components/floating-comments";
import { Trans } from "@/i18n/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { OidcSignInPrompt } from "./oidc-sign-in-prompt";

/**
 * The voting grid depends on two things the server cannot know: the
 * viewer's zone and Intl output for the option dates, and the viewport
 * breakpoint that picks the desktop or mobile layout. Rather than render the
 * rest of the page around a placeholder and let the grid shift it, the
 * whole page waits for hydration behind the same spinner the route streams
 * while its data loads, so there is one loader from first byte to
 * interactive. The page's server props are already in the tree by then, so
 * nothing else is fetched.
 *
 * A viewer who can manage the poll gets the admin page's frame, with a
 * way through to it in place of the admin controls, so switching between
 * the two pages does not shift the layout.
 */
export function InvitePage({
  pollId,
  description,
  footerLinks,
  canManage,
  oidcProviderName,
}: {
  pollId: string;
  oidcProviderName: string;
  description: React.ReactNode;
  footerLinks: { label: string; href: string }[];
  canManage: boolean;
}) {
  const hydrated = useHydrated();
  const oidcVoting = useOidcVoting();

  if (!hydrated) {
    return <InvitePageLoading />;
  }

  const content = (
    <>
      <EventCard description={description} />
      {oidcVoting === "signInRequired" ? (
        <OidcSignInPrompt
          providerName={oidcProviderName}
          redirectTo={`/invite/${pollId}`}
        />
      ) : null}
      <VotingForm>
        <ResponsiveResults />
        <FloatingComments />
      </VotingForm>
      <PollFooter footerLinks={footerLinks} />
      <div className="h-24 lg:hidden" />
    </>
  );

  if (canManage) {
    return (
      <PollPageShell
        header={
          <p className="flex min-w-0 items-center gap-x-2 text-muted-foreground text-sm">
            <EyeIcon className="size-4 shrink-0" />
            <span className="truncate">
              <Trans
                i18nKey="invitePageManagerNotice"
                defaults="You're viewing this poll as a participant"
              />
            </span>
          </p>
        }
        actions={
          <Link
            className={buttonVariants()}
            href={`/poll/${pollId}`}
            prefetch={false}
          >
            <Trans i18nKey="managePoll" defaults="Manage poll" />
            <ArrowUpRightIcon data-icon="inline-end" />
          </Link>
        }
      >
        {content}
      </PollPageShell>
    );
  }

  return (
    <div className="page-bg-gray-100 relative h-dvh overflow-auto p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl space-y-3"
      >
        {content}
      </main>
    </div>
  );
}

export function InvitePageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
