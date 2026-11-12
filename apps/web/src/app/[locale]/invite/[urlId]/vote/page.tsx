import { cn } from "@rallly/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { Spinner } from "@/components/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/features/branding/components/logo";
import {
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
} from "@/features/branding/constants";
import { loadInstanceBranding } from "@/features/branding/loaders";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { EventMetaDescription } from "@/features/poll/components/event-meta-description";
import { PollUnavailable } from "@/features/poll/invite/components/poll-unavailable";
import { loadInviteBallot } from "@/features/poll/invite/loaders";
import { loadPollAvailability, loadPollDetails } from "@/features/poll/loaders";
import { PoweredByLink } from "@/features/poll/vote/components/powered-by-link";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { AccessibleBallot } from "./components/accessible-ballot";
import { EventLockup } from "./components/event-lockup";
import { InviteHelp } from "./components/help/invite-help";
import { InviteHelpSheet } from "./components/help/invite-help-sheet";

type PageProps = {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{
    token?: string | string[];
    invite?: string | string[];
  }>;
};

function getInviteToken({
  token,
  invite,
}: {
  token?: string | string[];
  invite?: string | string[];
}) {
  // A repeated param arrives as an array. The client reads the first, so does this.
  const first = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;
  return first(token) ?? first(invite);
}

async function PageContent({ params, searchParams }: PageProps) {
  const { urlId } = await params;
  const [availability, { token: tokenParam, invite: inviteParam }] =
    await Promise.all([loadPollAvailability(urlId), searchParams]);

  if (!availability) {
    notFound();
  }

  if (availability.unavailable) {
    return (
      <PollUnavailable
        reason={availability.unavailable}
        footerLinks={await loadFooterLinks()}
      />
    );
  }

  const token = getInviteToken({ token: tokenParam, invite: inviteParam });
  const { t } = await getTranslation();
  const [poll, ballot, instanceBranding, footerLinks] = await Promise.all([
    loadPollDetails(urlId),
    loadInviteBallot({ pollId: urlId, token }),
    loadInstanceBranding(),
    loadFooterLinks(),
  ]);

  if (!poll || !ballot) {
    notFound();
  }

  // The Rallly logo stays off this page. An instance's own logo is its
  // operator's brand, so that one still shows.
  const showLogo =
    instanceBranding.logo.light !== DEFAULT_LOGO_URL ||
    instanceBranding.logo.dark !== DEFAULT_LOGO_URL_DARK;
  // Attribution can be turned off per instance or per space.
  const hideAttribution =
    instanceBranding.hideAttribution || (poll.space?.hideAttribution ?? false);
  const space = poll.space?.showBranding ? poll.space : null;
  // An instance's own links, or the hosted product's policies where they apply.
  const links =
    footerLinks.length > 0 || !isFeatureEnabled("hostedLegalLinks")
      ? footerLinks
      : [
          {
            label: t("voteFooterTerms", { defaultValue: "Terms of use" }),
            href: "https://rallly.co/terms-of-use",
          },
          {
            label: t("voteFooterPrivacy", { defaultValue: "Privacy policy" }),
            href: "https://rallly.co/privacy-policy",
          },
          {
            label: t("voteFooterCookies", { defaultValue: "Cookie policy" }),
            href: "https://rallly.co/cookie-policy",
          },
        ];

  return (
    <>
      {/* First in the reading order, and outside the card from lg. */}
      <header
        className={cn(
          "shrink-0 pt-4 lg:flex lg:h-16 lg:items-center lg:pt-0",
          // Only the toggles: beside the space's icon rather than a row of their own.
          space && !showLogo && "max-lg:absolute max-lg:top-0 max-lg:right-0",
        )}
      >
        <div className="flex flex-wrap items-start gap-x-3 px-4 lg:w-full lg:flex-nowrap lg:items-center lg:gap-x-4 lg:px-4">
          {showLogo ? (
            <div className="flex h-12 shrink-0 items-center">
              <Logo size="sm" />
            </div>
          ) : null}
          <div className="ml-auto flex h-12 shrink-0 items-center gap-1">
            <InviteHelpSheet>
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                }
              >
                <InviteHelp poll={poll} />
              </Suspense>
            </InviteHelpSheet>
            <ThemeToggle />
          </div>
          {/* Below lg the title lives here, unless the space brands the sidebar. */}
          {space ? null : (
            <h1 className="order-last mt-2 basis-full text-balance font-semibold text-xl tracking-tight lg:hidden">
              {poll.title}
            </h1>
          )}
        </div>
      </header>
      {/* From lg the sidebar and answers sit in a card of fixed height, inside which
          the sidebar and the answers each scroll on their own. Its width comes from main.
          The details step has only a short form, so there the card is as tall as
          that needs, up to the same height. */}
      <div
        data-invite-card
        className="flex flex-1 flex-col lg:mx-auto lg:my-auto lg:h-[min(45rem,calc(100dvh-8rem))] lg:w-fit lg:max-w-[calc(100%-2rem)] lg:flex-none lg:shrink lg:overflow-hidden lg:rounded-2xl lg:border lg:bg-card lg:shadow-xs lg:has-[[data-invite-details]]:h-auto lg:has-[[data-invite-details]]:max-h-[min(45rem,calc(100dvh-8rem))]"
      >
        <AccessibleBallot
          poll={poll}
          ballot={ballot}
          showCreatePollPrompt={
            !hideAttribution && isFeatureEnabled("createPollPrompt")
          }
          lockup={
            space ? (
              <EventLockup
                spaceName={space.name}
                spaceImage={space.image}
                title={poll.title}
              />
            ) : null
          }
          description={
            poll.description ? (
              <EventMetaDescription
                className="mt-2 text-base/7 text-muted-foreground lg:text-sm/6"
                content={poll.description}
              />
            ) : null
          }
        />
      </div>
      {/* Last in the reading order, and outside the card from lg. Its top padding
          keeps the links clear of the buttons above on a phone. */}
      <footer className="w-full shrink-0 px-4 pt-8 pb-6 text-xs lg:flex lg:h-16 lg:items-center lg:justify-center lg:py-0">
        <div className="flex flex-wrap items-center justify-center gap-x-4">
          {hideAttribution ? null : (
            <PoweredByLink
              pollId={poll.id}
              spaceId={poll.spaceId}
              plain={true}
            />
          )}
          <InstanceFooterLinks
            links={links}
            className="justify-center gap-y-0 [&_a]:inline-flex [&_a]:h-6 [&_a]:items-center [&_a]:text-xs"
          />
        </div>
      </footer>
    </>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense>
      <PageContent {...props} />
    </Suspense>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ urlId: string }>;
}): Promise<Metadata> {
  const { urlId } = await props.params;
  const availability = await loadPollAvailability(urlId);

  return {
    title: availability?.unavailable ? "Poll unavailable" : availability?.title,
    // Not linked from anywhere yet, so it stays out of search.
    robots: { index: false, follow: false },
  };
}
