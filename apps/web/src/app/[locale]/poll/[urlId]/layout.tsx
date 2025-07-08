import { prisma } from "@rallly/database";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";

import { PollLayout } from "@/components/layouts/poll-layout";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout(
  props: React.PropsWithChildren<{ params: Promise<{ urlId: string }> }>,
) {
  const params = await props.params;

  const { children } = props;

  const trpc = await createSSRHelper();

  // Prefetch all queries used in PollLayout
  const [poll] = await Promise.all([
    trpc.polls.get.fetch({ urlId: params.urlId }),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.getWatchers.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);

  if (!poll) {
    notFound();
  }

  if (!poll.adminUrlId) {
    redirect(`/invite/${params.urlId}`);
  }

  return (
    <HydrationBoundary state={dehydrate(trpc.queryClient)}>
      <PollLayout>{children}</PollLayout>
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; urlId: string }>;
}) {
  const params = await props.params;
  const poll = await prisma.poll.findUnique({
    where: { id: params.urlId },
    select: { title: true },
  });

  if (!poll) {
    return notFound();
  }
  return {
    title: poll.title,
  };
}
