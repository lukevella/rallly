import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PermissionProvider } from "@/contexts/permissions";
import { PreferencesProvider } from "@/contexts/preferences";
import { createPublicSSRHelper } from "@/trpc/server/create-ssr-helper";
import { decryptToken } from "@/utils/session";
import { InvitePageLoader } from "./invite-page-loader";
import Providers from "./providers";

const getPollMetadata = cache(async (urlId: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: urlId },
    select: {
      id: true,
      title: true,
      deleted: true,
      user: {
        select: {
          name: true,
          banned: true,
        },
      },
    },
  });

  if (!poll || poll.deleted || poll.user?.banned) {
    notFound();
  }
  return poll;
});

export default async function Page(props: {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await props.params;

  await getPollMetadata(params.urlId);

  const trpc = await createPublicSSRHelper();

  await Promise.all([
    trpc.polls.get.prefetch({ urlId: params.urlId }),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);

  const token = (await props.searchParams).token;

  let impersonatedUserId: string | null = null;
  if (token) {
    const res = await decryptToken<{ userId: string }>(token);
    if (res) {
      impersonatedUserId = res.userId;
    }
  }

  return (
    <HydrationBoundary state={dehydrate(trpc.queryClient)}>
      <PreferencesProvider>
        <Providers>
          <PermissionProvider impersonatedUserId={impersonatedUserId}>
            <InvitePageLoader />
          </PermissionProvider>
        </Providers>
      </PreferencesProvider>
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<{
    urlId: string;
    locale: string;
  }>;
}): Promise<Metadata> {
  const params = await props.params;

  const { urlId } = params;

  const poll = await getPollMetadata(urlId);

  const { title, id, user } = poll;

  const author = user?.name || "Guest";

  const ogImageUrl = absoluteUrl("/api/og-image-poll", {
    title,
    author,
  });

  return {
    title,
    metadataBase: new URL(absoluteUrl()),
    openGraph: {
      title,
      description: `By ${author}`,
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
