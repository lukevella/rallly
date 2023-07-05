import { trpc } from "@rallly/backend";
import { LockIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";

import { ProPlan } from "@/components/billing/billing-plans";
import { Card } from "@/components/card";
import { getPollLayout } from "@/components/layouts/poll-layout";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { Trans } from "@/components/trans";
import { usePlan } from "@/contexts/plan";
import { usePoll } from "@/contexts/poll";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const FinalizationForm = () => {
  const plan = usePlan();
  const poll = usePoll();
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
    <Card className="mx-auto max-w-3xl">
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

const Teaser = () => {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/10  backdrop-blur-sm">
        <div className="shadow-huge space-y-4 overflow-hidden rounded-md bg-white p-4">
          <div className="flex gap-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 shadow-sm">
              <LockIcon className="text-primary h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                <Trans i18nKey="upgradeOverlayTitle" defaults="Upgrade" />
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <Trans
                  i18nKey="upgradeOverlaySubtitle"
                  defaults="A paid plan is required to use this feature"
                />
              </p>
            </div>
          </div>
          <ProPlan annual={true}>
            <Button variant="primary" asChild className="w-full">
              <Link href="/settings/billing">
                <Trans
                  i18nKey="upgradeOverlayGoToBilling"
                  defaults="Go to billing"
                />
              </Link>
            </Button>
          </ProPlan>
        </div>
      </div>
      <FinalizationForm />
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  const plan = usePlan();

  if (plan === "paid") {
    return <FinalizationForm />;
  }

  return <Teaser />;
};

Page.getLayout = getPollLayout;

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
