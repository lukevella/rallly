import { prisma } from "@rallly/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTranslation } from "@/app/i18n";
import { absoluteUrl } from "@/utils/absolute-url";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <svg
        className="absolute inset-x-0 top-0 z-10 hidden h-[64rem] w-full stroke-gray-300/75 [mask-image:radial-gradient(800px_800px_at_center,white,transparent)] sm:block"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
            width={240}
            height={240}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 240V.5H240" fill="none" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
        />
      </svg>
      <div className="relative z-20">{children}</div>
    </div>
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
