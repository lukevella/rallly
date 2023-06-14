import { trpc } from "@rallly/backend";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { useRouter } from "next/router";
import React from "react";

import { getPollLayout } from "@/components/layouts/poll-layout";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { poll } = usePoll();
  const router = useRouter();
  const redirectBackToPoll = () => {
    router.replace(`/poll/${poll.id}`);
  };
  const queryClient = trpc.useContext();

  const bookDate = trpc.polls.book.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
      redirectBackToPoll();
    },
  });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="finalize" />
        </CardTitle>
        <CardDescription>
          <Trans
            i18nKey="finalizeDescription"
            defaults="Select a final date for your event."
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FinalizePollForm
          name="finalize"
          onSubmit={(data) => {
            bookDate.mutateAsync({
              pollId: poll.id,
              optionId: data.selectedOptionId,
              notify: data.notify,
            });
          }}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={redirectBackToPoll}>
          <Trans i18nKey="cancel" />
        </Button>
        <Button
          type="submit"
          loading={bookDate.isLoading}
          form="finalize"
          variant="primary"
        >
          <Trans i18nKey="finalize" />
        </Button>
      </CardFooter>
    </Card>
  );
};

Page.getLayout = getPollLayout;

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps = getStaticTranslations;
// export const getStaticProps = async () => {
//   return {
//     notFound: true,
//   };
// };

export default Page;
