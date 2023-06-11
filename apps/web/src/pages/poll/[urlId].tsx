import { trpc } from "@rallly/backend";
import { InfoIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "next-i18next";

import { getPollLayout } from "@/components/layouts/poll-layout";
import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const GuestPollAlert = () => {
  const poll = usePoll();
  const { user } = useUser();

  const queryClient = trpc.useContext();
  const claimPoll = trpc.polls.transfer.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });
  if (poll.user) {
    return null;
  }

  if (user.isGuest) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>
          <Trans
            i18nKey="guestPollAlertTitle"
            defaults="<0>Create an account</0> or <1>login</1> to claim this poll"
            components={[
              <Link
                className="hover:text-primary underline"
                key="register"
                href="/register"
              />,
              <Link
                className="hover:text-primary underline"
                key="login"
                href="/login"
              />,
            ]}
          />
        </AlertTitle>
        <AlertDescription>
          <Trans
            i18nKey="guestPollAlertDescription"
            defaults="Your administrator rights can be lost if you clear your cookies."
          />
        </AlertDescription>
      </Alert>
    );
  } else {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <div className="grid gap-4">
          <div>
            <AlertTitle>
              <Trans
                i18nKey="claimPollAlertTitle"
                defaults="Would you like to claim this poll?"
              />
            </AlertTitle>
            <AlertDescription>
              <Trans
                i18nKey="claimPollAlertDescription"
                defaults="This poll is not claimed by a registered user. You can claim it by clicking the button below."
              />
            </AlertDescription>
          </div>
          <div>
            <Button
              loading={claimPoll.isLoading}
              onClick={() => {
                claimPoll.mutate({ pollId: poll.id });
              }}
            >
              <Trans
                i18nKey="claim"
                defaults="Make me the owner of this poll"
              />
            </Button>
          </div>
        </div>
      </Alert>
    );
  }
};

const Page: NextPageWithLayout = () => {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-3 sm:space-y-4")}>
      <GuestPollAlert />
      <ParticipantPage />
    </div>
  );
};

Page.getLayout = getPollLayout;

export const getStaticPaths = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: "blocking", //indicates the type of fallback
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
