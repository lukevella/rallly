import { trpc } from "@rallly/backend";
import { ArrowUpLeftIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { Poll } from "@/components/poll";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { PermissionsContext } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
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

const Page = () => {
  return (
    <Prefetch>
      <LegacyPollContextProvider>
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
      </LegacyPollContextProvider>
    </Prefetch>
  );
};

export const getStaticPaths = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: "blocking", //indicates the type of fallback
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
