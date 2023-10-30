import { prisma } from "@rallly/database";
import { notFound } from "next/navigation";

import { PollLayout } from "@/components/layouts/poll-layout";

export default async function Layout({
  children,
  params,
}: React.PropsWithChildren<{ params: { urlId: string } }>) {
  const poll = await prisma.poll.findUnique({ where: { id: params.urlId } });
  if (!poll) {
    notFound();
  }

  return <PollLayout>{children}</PollLayout>;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; urlId: string };
}) {
  const poll = await prisma.poll.findUnique({ where: { id: params.urlId } });

  if (!poll) {
    return notFound();
  }
  return {
    title: poll.title,
  };
}
