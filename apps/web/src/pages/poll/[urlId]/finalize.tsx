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
            {`We're launching a paid tier soon with more features. Sign up to be notified when it's ready.`}
          </p>
        </div>
        <Card className="pointer-events-none mx-auto -mb-32 max-w-2xl select-none">
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
        </Card>
      </div>
    </div>
  );
};

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
