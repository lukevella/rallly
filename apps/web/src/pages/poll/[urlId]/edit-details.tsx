import { Button } from "@rallly/ui/button";
import { useRouter } from "next/router";

import { Card } from "@/components/card";
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

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
