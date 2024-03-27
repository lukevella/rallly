"use client";
import { Button } from "@rallly/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { useRouter } from "next/navigation";

import { Card } from "@/components/card";
import { PayWall } from "@/components/pay-wall";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { Trans } from "@/components/trans";
import { usePlan } from "@/contexts/plan";
import { usePoll } from "@/contexts/poll";
import { NextPageWithLayout } from "@/types";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

const FinalizationForm = () => {
  const plan = usePlan();
  const poll = usePoll();
  const posthog = usePostHog();

  const router = useRouter();
  const redirectBackToPoll = () => {
    router.replace(`/poll/${poll.id}`);
  };
  const queryClient = trpc.useUtils();

  const bookDate = trpc.polls.book.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
      redirectBackToPoll();
    },
  });

  return (
    <Card>
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
            if (plan === "paid") {
              bookDate.mutateAsync({
                pollId: poll.id,
                optionId: data.selectedOptionId,
                notify: data.notify,
              });

              posthog?.capture("finalize poll", {
                pollId: poll.id,
              });
            }
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

const Page: NextPageWithLayout = () => {
  return (
    <PayWall>
      <FinalizationForm />
    </PayWall>
  );
};

export default Page;
