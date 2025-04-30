import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { PermissionProvider } from "@/contexts/permissions";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

import Providers from "./providers";

const PermissionContext = async ({
  children,
  token,
}: React.PropsWithChildren<{ token?: string }>) => {
  const helpers = await createSSRHelper();
  let impersonatedUserId: string | null = null;
  if (token) {
    const res = await helpers.auth.getUserPermission.fetch({ token });
    impersonatedUserId = res?.userId ?? null;
  }
  return (
    <PermissionProvider userId={impersonatedUserId}>
      {children}
    </PermissionProvider>
  );
};

export default async function Page(props: {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{ token: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const trpc = await createSSRHelper();

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
        <PermissionContext token={searchParams.token}>
          <InvitePage />
        </PermissionContext>
      </Providers>
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<{
    urlId: string;
    locale: string;
  }>;
}) {
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
