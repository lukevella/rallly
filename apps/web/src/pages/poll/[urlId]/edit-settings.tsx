import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import {
  PollSettingsForm,
  PollSettingsFormData,
} from "@/components/forms/poll-settings";
import { getPollLayout } from "@/components/layouts/poll-layout";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const poll = usePoll();

  const router = useRouter();

  const pollLink = `/poll/${poll.id}`;

  const redirectBackToPoll = () => {
    router.push(pollLink);
  };

  const update = useUpdatePollMutation();

  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      hideParticipants: poll.hideParticipants,
      hideScores: poll.hideScores,
      disableComments: poll.disableComments,
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto max-w-3xl"
        onSubmit={form.handleSubmit(async (data) => {
          //submit
          await update.mutateAsync(
            { urlId: poll.adminUrlId, ...data },
            {
              onSuccess: redirectBackToPoll,
            },
          );
        })}
      >
        <PollSettingsForm>
          <CardFooter className="justify-between">
            <Button asChild>
              <Link href={pollLink}>
                <Trans i18nKey="cancel" />
              </Link>
            </Button>
            <Button type="submit" variant="primary">
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </PollSettingsForm>
      </form>
    </Form>
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
