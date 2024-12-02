import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { notFound } from "next/navigation";

import { InvitePage } from "@/app/[locale]/invite/[urlId]/invite-page";
import { PermissionProvider } from "@/contexts/permissions";
import { getTranslation } from "@/i18n/server";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

const PermissionContext = async ({
  children,
  token,
}: React.PropsWithChildren<{ token?: string }>) => {
  const helpers = await createSSRHelper();
  let impersonatedUserId: string | null = null;
  if (token) {
    const res = await helpers.auth.getUserPermission.fetch({ token });
    impersonatedUserId = res?.userId ?? null;
  }
  return (
    <PermissionProvider userId={impersonatedUserId}>
      {children}
    </PermissionProvider>
  );
};

export default async function Page({
  searchParams,
}: {
  params: { urlId: string };
  searchParams: { token: string };
}) {
  return (
    <PermissionContext token={searchParams.token}>
      <InvitePage />
    </PermissionContext>
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
