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

import { PollDetailsForm } from "@/components/forms/poll-details-form";
import { getPollLayout } from "@/components/layouts/poll-layout";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

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
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="editDetails" defaults="Edit details" />
        </CardTitle>
        <CardDescription>
          <Trans
            i18nKey="editDetailsDescription"
            defaults="Change the details of your event."
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PollDetailsForm
          name="updateDetails"
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
      </CardContent>
      <CardFooter className="justify-between">
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

export default Page;
