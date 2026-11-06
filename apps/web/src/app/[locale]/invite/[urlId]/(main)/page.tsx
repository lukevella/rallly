import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { EventMetaDescription } from "@/features/poll/components/event-meta-description";
import { InviteOpenRecorder } from "@/features/poll/invite/components/invite-open-recorder";
import { PollUnavailable } from "@/features/poll/invite/components/poll-unavailable";
import { loadInvitePoll, loadPollAvailability } from "@/features/poll/loaders";
import {
  getInviteToken,
  InvitePollProviders,
} from "./components/invite-poll-providers";
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

  const token = getInviteToken({ token: tokenParam, invite: inviteParam });

  const [invitePoll, footerLinks] = await Promise.all([
    loadInvitePoll({ pollId: urlId, token }),
    loadFooterLinks(),
  ]);

  return (
    <>
      {token ? <InviteOpenRecorder pollId={urlId} token={token} /> : null}
      <InvitePollProviders invitePoll={invitePoll}>
        <InvitePage
          // Rendered here so the markdown parser stays on the server
          description={
            <EventMetaDescription
              className="mt-3 max-w-3xl text-base/7 text-muted-foreground lg:text-sm/6"
              content={invitePoll.poll.description}
            />
          }
          footerLinks={footerLinks}
        />
      </InvitePollProviders>
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
