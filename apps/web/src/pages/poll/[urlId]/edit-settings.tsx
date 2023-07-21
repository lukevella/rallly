import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
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
    },
  });

  return (
    <Form {...form}>
      <form
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
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="settings" defaults="Settings" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PollSettingsForm />
          </CardContent>
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
        </Card>
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
