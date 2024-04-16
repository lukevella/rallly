"use client";
import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { useForm } from "react-hook-form";

import {
  PollSettingsForm,
  PollSettingsFormData,
} from "@/components/forms/poll-settings";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

const Page = () => {
  const poll = usePoll();

  const update = useUpdatePollMutation();

  const form = useForm<PollSettingsFormData>({
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
          await update.mutateAsync({ urlId: poll.adminUrlId, ...data });
          form.reset(data);
        })}
      >
        <PollSettingsForm>
          <CardFooter>
            <Button
              disabled={!form.formState.isDirty}
              type="submit"
              variant="primary"
            >
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </PollSettingsForm>
      </form>
    </Form>
  );
};

export default Page;
