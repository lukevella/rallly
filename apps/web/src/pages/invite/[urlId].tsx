import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { ArrowUpLeftIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

import { Poll } from "@/components/poll";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { PermissionsContext } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { withPageTranslations } from "@/utils/with-page-translations";

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

const Page = ({ forceUserId }: { forceUserId: string }) => {
  const poll = usePoll();
  return (
    <PermissionsContext.Provider value={{ userId: forceUserId }}>
      <Head>
        <title>{poll.title}</title>
      </Head>
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
    </PermissionsContext.Provider>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(),
    async (ctx) => {
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );

        if (res) {
          return {
            props: {
              forceUserId: res.userId,
            },
          };
        }
      }

      return { props: {} };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      const poll = await ssg.polls.get.fetch({
        urlId: ctx.params?.urlId as string,
      });

      await ssg.polls.participants.list.prefetch({
        pollId: poll.id,
      });
    },
  },
);

export default Page;
