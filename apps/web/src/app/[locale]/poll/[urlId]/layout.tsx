import { prisma } from "@rallly/database";
import { dehydrate, Hydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { PollLayout } from "@/components/layouts/poll-layout";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout({
  children,
  params,
}: React.PropsWithChildren<{ params: { urlId: string } }>) {
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

  return (
    <Hydrate state={dehydrate(trpc.queryClient)}>
      <PollLayout>{children}</PollLayout>
    </Hydrate>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; urlId: string };
}) {
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
