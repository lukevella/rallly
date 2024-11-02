import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { notFound } from "next/navigation";

import { Redirect } from "@/app/components/redirect";

import type { PParams } from "./types";

export default async function Page({ params }: { params: PParams }) {
  const { participantUrlId } = params;

  const poll = await prisma.poll.findUnique({
    where: { participantUrlId },
    select: { id: true },
  });

  if (!poll) {
    notFound();
  }

  return (
    <Redirect
      from={absoluteUrl(`/p/${params.participantUrlId}`)}
      href={absoluteUrl(`/invite/${poll.id}`)}
    />
  );
}
