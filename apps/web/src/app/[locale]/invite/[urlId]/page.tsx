import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { PermissionProvider } from "@/contexts/permissions";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";
import Providers from "./providers";

export default async function Page(props: {
  params: Promise<{ urlId: string }>;
}) {
  const params = await props.params;
  const trpc = createSSRHelper();

  const [poll] = await Promise.all([
    trpc.polls.get.fetch({ urlId: params.urlId }),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);

  if (!poll || poll.deleted || poll.user?.banned) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(trpc.queryClient)}>
      <Providers>
        <PermissionProvider>
          <InvitePage />
        </PermissionProvider>
      </Providers>
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

  const poll = await prisma.poll.findUnique({
    where: {
      id: urlId as string,
    },
    select: {
      id: true,
      title: true,
      deleted: true,
      updatedAt: true,
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
