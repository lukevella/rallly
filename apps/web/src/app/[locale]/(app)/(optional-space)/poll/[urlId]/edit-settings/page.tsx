"use client";
import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { PollSettingsForm } from "@/components/forms/poll-settings";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/contexts/poll";
import { Trans } from "@/i18n/client";

const Page = () => {
  const poll = usePoll();

  const router = useRouter();

  const pollLink = `/poll/${poll.id}`;

  const redirectBackToPoll = () => {
    router.push(pollLink);
  };

  const update = useUpdatePollMutation();

  const form = useForm({
    defaultValues: {
      hideParticipants: poll.hideParticipants,
      hideScores: poll.hideScores,
      disableComments: poll.disableComments,
      requireParticipantEmail: poll.requireParticipantEmail,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          //submit
          const res = await update.mutateAsync({
            urlId: poll.adminUrlId,
            ...data,
          });
          if (res.ok) {
            redirectBackToPoll();
          }
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

export default Page;
