import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { notFound } from "next/navigation";

import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { getTranslation } from "@/i18n/server";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Page({ params }: { params: { urlId: string } }) {
  const trpc = await createSSRHelper();

  // Prefetch all queries used in PollLayout
  await Promise.all([
    trpc.polls.get.prefetch({ urlId: params.urlId }),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);
  return <InvitePage />;
}

export async function generateMetadata({
  params: { urlId, locale },
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

  const { t } = await getTranslation(locale);

  if (!poll) {
    notFound();
  }

  const { title, id, user } = poll;

  const author =
    user?.name ||
    t("guest", {
      ns: "app",
      defaultValue: "Guest",
    });

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
          type: "image/png",
        },
      ],
    },
  };
}
