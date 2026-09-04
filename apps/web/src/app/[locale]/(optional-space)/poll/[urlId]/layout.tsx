import { prisma } from "@rallly/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PollLayout } from "@/features/poll/components/poll-layout";
import { loadPollInvites } from "@/features/poll/invite/loaders";
import { createPublicSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout(
  props: React.PropsWithChildren<{ params: Promise<{ urlId: string }> }>,
) {
  const params = await props.params;

  const { children } = props;

  const trpc = await createPublicSSRHelper();

  const poll = await trpc.polls.get
    .fetch({ urlId: params.urlId })
    .catch((e) => {
      if (e instanceof TRPCError && e.code === "NOT_FOUND") {
        notFound();
      }
      throw e;
    });

  if (!poll.canManage) {
    redirect(`/invite/${params.urlId}`);
  }

  const [invites] = await Promise.all([
    loadPollInvites(params.urlId),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(trpc.queryClient)}>
      <PollLayout invites={invites}>{children}</PollLayout>
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; urlId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const poll = await prisma.poll.findUnique({
    where: { id: params.urlId },
    select: { title: true },
  });

  if (!poll) {
    notFound();
  }
  return {
    title: poll.title,
  };
}
