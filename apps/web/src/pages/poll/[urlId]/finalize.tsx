import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rallly/ui/accordion";
import { Button } from "@rallly/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { useRouter } from "next/router";

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
  // const queryClient = trpc.useContext();

  // const bookDate = trpc.polls.book.useMutation({
  //   onSuccess: () => {
  //     queryClient.polls.invalidate();
  //     redirectBackToPoll();
  //   },
  // });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="bg-pattern overflow-hidden rounded-md border p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="bg-primary rounded-full px-2.5 py-0.5 text-sm font-semibold text-white">
              Pro
            </span>
          </div>
          <h1 className="mb-1">{`Finalize your Poll`}</h1>
          <p className="text-muted-foreground mx-auto max-w-lg">
            {`We're launching a paid tier soon with more features!`}
          </p>
        </div>
        <div className="shadow-huge pointer-events-none mx-auto -mb-24 max-w-3xl select-none rounded-md border bg-white">
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
              onSubmit={() => {
                // coming soon…
                // bookDate.mutateAsync({
                //   pollId: poll.id,
                //   optionId: data.selectedOptionId,
                //   notify: data.notify,
                // });
              }}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={redirectBackToPoll}>
              <Trans i18nKey="cancel" />
            </Button>
            <Button
              type="submit"
              // loading={bookDate.isLoading}
              form="finalize"
              variant="primary"
            >
              <Trans i18nKey="finalize" />
            </Button>
          </CardFooter>
        </div>
      </div>
      <Accordion type="single">
        <AccordionItem value="whyNotFree">
          <AccordionTrigger>{`Why isn't this free?`}</AccordionTrigger>
          <AccordionContent>
            {`Rallly has been running for over 7 years and has been free for everyone to use. We've been able to do this thanks to the generosity of our users who have donated to help keep the service running. However, we've reached a point where we need to start generating revenue to be able to grow and continue to develop new features. We've decided to introduce a paid tier to help us achieve this.`}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="whatAreTheBenefits">
          <AccordionTrigger>
            {`What are the benefits of upgrading to Rallly Pro?`}
          </AccordionTrigger>
          <AccordionContent>
            {`As a Pro user, you will be able to finalize your polls and send calendar invites to your participants. We plan to deliver plenty of new features and as a Pro user you will have access to all new features as well. You will also receive priority support and be able to help shape the future of Rallly.`}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="howMuch">
          <AccordionTrigger>How much does Rallly Pro cost?</AccordionTrigger>
          <AccordionContent>
            {`For early adopters, Rallly Pro will be available for just $4.99 per month or $24.99 if you sign up for a whole year. We will adjust the price as we add more features so you will be getting a significantly reduced rate by signing up early.`}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="freeUse">
          <AccordionTrigger>Can I still use Rallly for free?</AccordionTrigger>
          <AccordionContent>
            {`Yes, the free service remains exactly the same.`}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="howToUpgrade">
          <AccordionTrigger>How can I upgrade to Rallly Pro?</AccordionTrigger>
          <AccordionContent>
            {`We're just setting up a checkout system and once this is ready you will be able to upgrade.`}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
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
