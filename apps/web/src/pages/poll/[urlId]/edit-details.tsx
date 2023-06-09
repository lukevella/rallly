import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { Button } from "@rallly/ui/button";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import { Card } from "@/components/card";
import { PollDetailsForm } from "@/components/forms/poll-details-form";
import { getPollLayout } from "@/components/layouts/poll-layout";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { poll } = usePoll();
  const urlId = poll.adminUrlId;
  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const router = useRouter();
  const redirectBackToPoll = () => {
    router.replace(`/poll/${poll.id}`);
  };
  return (
    <Card className="mx-auto max-w-4xl" fullWidthOnMobile={true}>
      <PollDetailsForm
        name="updateDetails"
        className="p-3 sm:py-5 sm:px-6"
        defaultValues={{
          title: poll.title,
          location: poll.location ?? "",
          description: poll.description ?? "",
        }}
        onSubmit={(data) => {
          //submit
          updatePollMutation(
            { urlId, ...data },
            { onSuccess: redirectBackToPoll },
          );
        }}
      />

      <div className="flex justify-end gap-2 bg-gray-50 p-3">
        <Button onClick={redirectBackToPoll}>
          <Trans i18nKey="cancel" />
        </Button>
        <Button
          type="submit"
          loading={isUpdating}
          form="updateDetails"
          variant="primary"
        >
          <Trans i18nKey="save" />
        </Button>
      </div>
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
