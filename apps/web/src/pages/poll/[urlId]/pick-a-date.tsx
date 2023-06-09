import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { GetServerSideProps } from "next";

import { getPollLayout } from "@/components/layouts/poll-layout";
import { FinalizePollDialog } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pick a date</CardTitle>
        <CardDescription>Choose the final date for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <FinalizePollDialog />
      </CardContent>
    </Card>
  );
};

Page.getLayout = getPollLayout;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(),
    async (ctx) => {
      let userId: string | null = null;
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );
        if (res) {
          userId = res.userId;
        }
      }
      return {
        props: {
          forceUserId: userId,
        },
      };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      await ssg.polls.get.fetch({
        urlId: ctx.params?.urlId as string,
      });
    },
  },
);

export default Page;
