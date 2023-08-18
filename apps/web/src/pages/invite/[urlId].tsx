import { trpc } from "@rallly/backend";
import { prisma } from "@rallly/database";
import { ArrowUpLeftIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { absoluteUrl } from "@rallly/utils";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import { Poll } from "@/components/poll";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { UserProvider, useUser } from "@/components/user-provider";
import { VisibilityProvider } from "@/components/visibility";
import { PermissionsContext } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { DayjsProvider } from "@/utils/dayjs";
import { getStaticTranslations } from "@/utils/with-page-translations";

import Error404 from "../404";

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const router = useRouter();
  const [urlId] = React.useState(router.query.urlId as string);

  const { data: permission } = trpc.auth.getUserPermission.useQuery(
    { token: router.query.token as string },
    {
      enabled: !!router.query.token,
    },
  );

  const { data: poll, error } = trpc.polls.get.useQuery(
    { urlId },
    {
      retry: false,
    },
  );

  const { data: participants } = trpc.polls.participants.list.useQuery({
    pollId: urlId,
  });

  if (error?.data?.code === "NOT_FOUND") {
    return <Error404 />;
  }
  if (!poll || !participants) {
    return null;
  }

  return (
    <PermissionsContext.Provider value={{ userId: permission?.userId ?? null }}>
      <Head>
        <title>{poll.title}</title>
      </Head>
      {children}
    </PermissionsContext.Provider>
  );
};

const GoToApp = () => {
  const poll = usePoll();
  const { user } = useUser();

  if (poll.user?.id !== user.id) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href={`/poll/${poll.id}`}>
            <ArrowUpLeftIcon className="h-4 w-4" />
            <Trans i18nKey="manage" />
          </Link>
        </Button>
      </div>
      <hr />
    </>
  );
};

type PageProps = {
  title: string;
  user: string | null;
};

const Page = ({ title, user }: PageProps) => {
  const { t } = useTranslation();
  const name = user ?? t("guest");
  return (
    <>
      <NextSeo
        openGraph={{
          title,
          description: `By ${name}`,
          images: [
            {
              url:
                `${absoluteUrl()}/_next/image?w=1200&q=100&url=${encodeURIComponent(
                  `/api/og-image-poll`,
                )}` +
                encodeURIComponent(
                  `?title=${encodeURIComponent(
                    title,
                  )}&author=${encodeURIComponent(name)}`,
                ),
              width: 1200,
              height: 630,
              alt: title,
              type: "image/png",
            },
          ],
        }}
      />
      <UserProvider>
        <DayjsProvider>
          <Prefetch>
            <LegacyPollContextProvider>
              <VisibilityProvider>
                <div className="">
                  <svg
                    className="absolute inset-x-0 top-0 -z-10 hidden h-[64rem] w-full stroke-gray-300/75 [mask-image:radial-gradient(800px_800px_at_center,white,transparent)] sm:block"
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
                  <div className="mx-auto max-w-4xl space-y-4 p-3 sm:py-8">
                    <GoToApp />
                    <Poll />
                    <div className="mt-4 space-y-4 text-center text-gray-500">
                      <div className="py-8">
                        <Trans
                          defaults="Powered by <a>{name}</a>"
                          i18nKey="poweredByRallly"
                          values={{ name: "rallly.co" }}
                          components={{
                            a: (
                              <Link
                                className="hover:text-primary-600 rounded-none border-b border-b-gray-500 font-semibold"
                                href="https://rallly.co"
                              />
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </VisibilityProvider>
            </LegacyPollContextProvider>
          </Prefetch>
        </DayjsProvider>
      </UserProvider>
    </>
  );
};

export const getStaticPaths = async () => {
  return {
    paths: [], // indicates that no page needs be created at build time
    fallback: "blocking", // indicates the type of fallback
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  // We get these props to be able to render the og:image
  const poll = await prisma.poll.findUniqueOrThrow({
    where: {
      id: ctx.params?.urlId as string,
    },
    select: {
      title: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const res = await getStaticTranslations(ctx);

  if ("props" in res) {
    return {
      props: {
        ...res.props,
        title: poll.title,
        user: poll.user?.name ?? null,
      },
      revalidate: 10,
    };
  }

  return res;
};

export default Page;
