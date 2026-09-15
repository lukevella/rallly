import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SessionRefresher } from "@/components/session-refresher";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { PollProvider } from "@/features/poll/client";
import { PollBrandingFromContext } from "@/features/poll/components/poll-branding";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { VisibilityProvider } from "@/features/poll/components/visibility";
import { InviteOpenRecorder } from "@/features/poll/invite/components/invite-open-recorder";
import { PollUnavailable } from "@/features/poll/invite/components/poll-unavailable";
import { loadInvitePoll, loadPollAvailability } from "@/features/poll/loaders";
import { UserProvider } from "@/features/user/client";
import { getLocale } from "@/i18n/server/get-locale";
import { DeviceDateTimeProvider } from "@/lib/datetime/device";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import { InvitePage, InvitePageLoading } from "./invite-page";

type PageProps = {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{
    token?: string | string[];
    invite?: string | string[];
  }>;
};

async function InvitePageContent({ params, searchParams }: PageProps) {
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
    { poll, participants, comments, linkedParticipantIds, user },
    locale,
    deviceDateTimeConfig,
    footerLinks,
  ] = await Promise.all([
    loadInvitePoll({ pollId: urlId, token }),
    getLocale(),
    getDeviceDateTimeConfig(),
    loadFooterLinks(),
  ]);

  return (
    <>
      <SessionRefresher />
      {token ? <InviteOpenRecorder pollId={urlId} token={token} /> : null}
      <UserProvider user={user}>
        <DeviceDateTimeProvider
          locale={locale}
          timeZone={deviceDateTimeConfig.timeZone}
          timeFormat={deviceDateTimeConfig.timeFormat}
        >
          <PollProvider
            poll={poll}
            participants={participants}
            comments={comments}
            linkedParticipantIds={linkedParticipantIds}
            viewerRole="participant"
          >
            <LegacyPollContextProvider>
              <VisibilityProvider>
                <PollBrandingFromContext />
                <InvitePage footerLinks={footerLinks} />
              </VisibilityProvider>
            </LegacyPollContextProvider>
          </PollProvider>
        </DeviceDateTimeProvider>
      </UserProvider>
    </>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<InvitePageLoading />}>
      <InvitePageContent {...props} />
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
