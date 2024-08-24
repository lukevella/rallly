import { prisma } from "@rallly/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { absoluteUrl } from "@/utils/absolute-url";

export default async function Page() {
  return <InvitePage />;
}

export async function generateMetadata({
  params: { urlId },
}: {
  params: {
    urlId: string;
    locale: string;
  };
}) {
  const poll = await prisma.poll.findUnique({
    where: {
      id: urlId as string,
    },
    select: {
      id: true,
      title: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!poll) {
    return notFound();
  }

  return {
    title: poll.title,
    metadataBase: new URL(absoluteUrl()),
  } satisfies Metadata;
}
