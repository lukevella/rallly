import { cn } from "@rallly/ui";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { SessionRefresher } from "@/components/session-refresher";
import { Spinner } from "@/components/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { loadInstanceBranding } from "@/features/branding/loaders";
import { loadInstancePolicy } from "@/features/instance-policy/loaders";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { EventMetaDescription } from "@/features/poll/components/event-meta-description";
import { InviteOpenRecorder } from "@/features/poll/invite/components/invite-open-recorder";
import { PollUnavailable } from "@/features/poll/invite/components/poll-unavailable";
import { loadInviteBallot } from "@/features/poll/invite/loaders";
import { loadPollAvailability, loadPollDetails } from "@/features/poll/loaders";
import { PoweredByLink } from "@/features/poll/vote/components/powered-by-link";
import {
  loadCanManagePoll,
  loadOptionalResponder,
  loadVoteComments,
} from "@/features/poll/vote/loaders";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { AccessibleBallot } from "./components/accessible-ballot";
import { CollapsibleDescription } from "./components/collapsible-description";
import { EventLockup } from "./components/event-lockup";
import { InviteHelp } from "./components/help/invite-help";
import { InviteHelpSheet } from "./components/help/invite-help-sheet";
import { ManagePollLink } from "./components/manage-poll-link";
import { VoteComments, VoteCommentsSheet } from "./components/vote-comments";

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

// Started ahead of the availability check, so a branch that returns early may
// never await it. Marked handled so its rejection cannot go unhandled; an
// await still sees the error.
function startEarly<T>(promise: Promise<T>) {
  promise.catch(() => {});
  return promise;
}

async function PageContent({ params, searchParams }: PageProps) {
  const { urlId } = await params;
  const responderRead = startEarly(loadOptionalResponder());
  const footerLinksRead = startEarly(loadFooterLinks());
  const tokenRead = startEarly(searchParams.then(getInviteToken));
  const rest = startEarly(
    Promise.all([
      loadPollDetails(urlId),
      tokenRead.then((token) => loadInviteBallot(urlId, token)),
      loadInstanceBranding(),
      loadInstancePolicy(),
      loadCanManagePoll(urlId),
      getTranslation(),
      loadVoteComments(urlId),
    ]),
  );

  const availability = await loadPollAvailability(urlId);

  if (!availability) {
    notFound();
  }

  if (availability.unavailable) {
    return (
      <PollUnavailable
        reason={availability.unavailable}
        footerLinks={await footerLinksRead}
      />
    );
  }

  const [
    [
      poll,
      ballot,
      instanceBranding,
      instancePolicy,
      canManage,
      { t },
      comments,
    ],
    footerLinks,
    token,
  ] = await Promise.all([rest, footerLinksRead, tokenRead]);

  if (!poll || !ballot) {
    notFound();
  }

  const responder = await responderRead;

  // Attribution can be turned off per instance or per space.
  const hideAttribution =
    instanceBranding.hideAttribution || (poll.space?.hideAttribution ?? false);
  // Whose identity heads the sidebar: the space's when it brands its polls,
  // or the instance's when the operator's white label replaces every space's.
  const brand = poll.space?.showBranding
    ? { name: poll.space.name, image: poll.space.image }
    : instancePolicy.spaceBrandingAllowed
      ? null
      : { name: instanceBranding.appName, image: instanceBranding.logoIcon };
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
      <SessionRefresher />
      {token ? <InviteOpenRecorder pollId={poll.id} token={token} /> : null}
      {/* First in the reading order, and outside the card from lg. */}
      <header
        className={cn(
          "shrink-0 pt-4 lg:flex lg:h-16 lg:items-center lg:pt-0",
          // Only the toggles: beside the brand's icon rather than a row of their own.
          brand && "max-lg:absolute max-lg:top-0 max-lg:right-0",
        )}
      >
        <div className="flex flex-wrap items-start gap-x-3 px-4 lg:w-full lg:flex-nowrap lg:items-center lg:gap-x-4 lg:px-4">
          <div className="ml-auto flex h-12 shrink-0 items-center gap-1">
            {canManage ? (
              <ManagePollLink pollId={poll.id}>
                {t("managePoll", { defaultValue: "Manage poll" })}
              </ManagePollLink>
            ) : null}
            {poll.disableComments ? null : (
              <VoteCommentsSheet pollId={poll.id} count={comments.length}>
                <VoteComments
                  pollId={poll.id}
                  comments={comments}
                  canComment={!poll.event}
                  signedInName={responder?.name}
                  defaultName={ballot.ownResponses[0]?.name}
                />
              </VoteCommentsSheet>
            )}
            <InviteHelpSheet pollId={poll.id}>
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
          {/* Below lg the title lives here, unless a brand heads the sidebar. */}
          {brand ? null : (
            <h1 className="order-last mt-2 basis-full text-balance font-semibold text-xl tracking-tight lg:hidden">
              {poll.title}
            </h1>
          )}
        </div>
      </header>
      {/* From lg the sidebar and answers sit in a card. Main sets its size: 4:3
          where the screen has room, and never taller than the screen. */}
      <div
        data-invite-card
        className="flex flex-1 flex-col lg:mx-auto lg:my-auto lg:max-h-[calc(100dvh-8rem)] lg:w-fit lg:max-w-[calc(100%-2rem)] lg:flex-none lg:shrink lg:overflow-hidden lg:rounded-2xl lg:border lg:bg-card lg:shadow-xs"
      >
        <AccessibleBallot
          poll={poll}
          ballot={ballot}
          defaultName={responder?.name}
          defaultEmail={responder?.email}
          showCreatePollPrompt={
            !hideAttribution && isFeatureEnabled("createPollPrompt")
          }
          lockup={
            brand ? (
              <EventLockup
                name={brand.name}
                image={brand.image}
                title={poll.title}
              />
            ) : null
          }
          description={
            poll.description ? (
              <CollapsibleDescription pollId={poll.id}>
                <EventMetaDescription
                  className="mt-2 text-base/7 text-muted-foreground lg:text-sm/6"
                  content={poll.description}
                />
              </CollapsibleDescription>
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

  if (!availability) {
    notFound();
  }

  // Not linked from anywhere yet, so it stays out of search.
  const robots = { index: false, follow: false };

  if (availability.unavailable) {
    return { title: "Poll unavailable", robots };
  }

  const { title, id, authorName } = availability;

  return {
    title,
    metadataBase: new URL(absoluteUrl()),
    openGraph: {
      title,
      description: `By ${authorName}`,
      // The address people share, which this page will take over.
      url: `/invite/${id}`,
      images: [
        {
          url: absoluteUrl("/api/og-image-poll", { title, author: authorName }),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    robots,
  };
}
