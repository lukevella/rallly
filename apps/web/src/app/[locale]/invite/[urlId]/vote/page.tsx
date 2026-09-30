import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SessionRefresher } from "@/components/session-refresher";
import { loadInstanceBranding } from "@/features/branding/loaders";
import { loadInstancePolicy } from "@/features/instance-policy/loaders";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { InviteOpenRecorder } from "@/features/poll/invite/components/invite-open-recorder";
import { PollUnavailable } from "@/features/poll/invite/components/poll-unavailable";
import { loadPollAvailability } from "@/features/poll/loaders";
import { PollBranding } from "@/features/poll/vote/components/poll-branding";
import { loadCanManagePoll, loadVotePage } from "@/features/poll/vote/loaders";
import { getLocale } from "@/i18n/server/get-locale";
import { getSession } from "@/lib/auth";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { VotePage, VotePageLoading } from "./vote-page";

type PageProps = {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{
    token?: string | string[];
    invite?: string | string[];
  }>;
};

/**
 * Preview of the merged participant layout at `/invite/[urlId]/vote`. It
 * serves the same poll as the invite page and will replace it once the
 * layout is adopted, so it is kept out of search indexes meanwhile.
 */
async function VotePageContent({ params, searchParams }: PageProps) {
  const { urlId } = await params;

  const [availability, { token: tokenParam, invite: inviteParam }] =
    await Promise.all([loadPollAvailability(urlId), searchParams]);

  if (!availability) {
    notFound();
  }

  if (availability.unavailable) {
    const footerLinks = await loadFooterLinks();
    return (
      <PollUnavailable
        reason={availability.unavailable}
        footerLinks={footerLinks}
      />
    );
  }

  // `invite` is the param older invite emails carry; both name the same
  // token and the client reads them the same way. A repeated param arrives
  // as an array; only a single value is a token.
  const token = [tokenParam, inviteParam].find(
    (value): value is string => typeof value === "string",
  );

  const [
    view,
    session,
    locale,
    deviceDateTimeConfig,
    footerLinks,
    instancePolicy,
    instanceBranding,
    canManage,
  ] = await Promise.all([
    loadVotePage({ pollId: urlId, token }),
    getSession(),
    getLocale(),
    getDeviceDateTimeConfig(),
    loadFooterLinks(),
    loadInstancePolicy(),
    loadInstanceBranding(),
    loadCanManagePoll(urlId),
  ]);

  const { poll } = view;
  const spaceBranding =
    poll.space?.showBranding && instancePolicy.spaceBrandingAllowed
      ? poll.space
      : null;

  return (
    <>
      <SessionRefresher />
      {token ? <InviteOpenRecorder pollId={urlId} token={token} /> : null}
      <DeviceDateTimeProvider
        locale={locale}
        timeZone={deviceDateTimeConfig.timeZone}
        timeFormat={deviceDateTimeConfig.timeFormat}
      >
        <PollBranding primaryColor={spaceBranding?.primaryColor ?? null} />
        <VotePage
          view={view}
          footerLinks={footerLinks}
          hideAttribution={
            instanceBranding.hideAttribution ||
            (poll.space?.hideAttribution ?? false)
          }
          canManage={canManage}
          requireParticipantEmail={poll.requireParticipantEmail}
          user={session?.user ?? null}
          spaceBrandingAllowed={instancePolicy.spaceBrandingAllowed}
          instanceBranding={instanceBranding}
        />
      </DeviceDateTimeProvider>
    </>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<VotePageLoading />}>
      <VotePageContent {...props} />
    </Suspense>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ urlId: string; locale: string }>;
}): Promise<Metadata> {
  const { urlId } = await props.params;

  const availability = await loadPollAvailability(urlId);

  if (!availability) {
    notFound();
  }

  if (availability.unavailable) {
    return {
      title: "Poll unavailable",
      robots: { index: false, follow: false },
    };
  }

  const { title, id, authorName } = availability;

  const ogImageUrl = absoluteUrl("/api/og-image-poll", {
    title,
    author: authorName,
  });

  return {
    title,
    robots: { index: false, follow: false },
    metadataBase: new URL(absoluteUrl()),
    openGraph: {
      title,
      description: `By ${authorName}`,
      url: `/invite/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}
