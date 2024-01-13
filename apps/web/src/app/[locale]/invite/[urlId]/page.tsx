import { prisma } from "@rallly/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { PageContainer } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { absoluteUrl } from "@/utils/absolute-url";

export default async function Page() {
  return (
    <PageContainer>
      <InvitePage />
    </PageContainer>
  );
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
    return notFound();
  }

  const { title, id, user } = poll;

  const author = user?.name || t("guest");

  return {
    title,
    metadataBase: new URL(absoluteUrl()),
    openGraph: {
      title,
      description: `By ${author}`,
      url: `/invite/${id}`,
      images: [
        {
          url: `${absoluteUrl("/api/og-image-poll", {
            title,
            author,
          })}`,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
  } satisfies Metadata;
}
