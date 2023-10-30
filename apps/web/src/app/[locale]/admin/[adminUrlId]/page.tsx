import { prisma } from "@rallly/database";
import { notFound } from "next/navigation";

import { Redirect } from "@/app/components/redirect";
import { absoluteUrl } from "@/utils/absolute-url";

import { PParams } from "./types";

export default async function Page({ params }: { params: PParams }) {
  const { adminUrlId } = params;

  const poll = await prisma.poll.findUnique({
    where: { adminUrlId },
    select: { id: true },
  });

  if (!poll) {
    notFound();
  }

  return (
    <Redirect
      from={absoluteUrl(`/admin/${params.adminUrlId}`)}
      href={absoluteUrl(`/poll/${poll.id}`)}
    />
  );
}
