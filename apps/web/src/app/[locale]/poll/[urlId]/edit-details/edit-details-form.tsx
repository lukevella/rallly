"use client";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { useForm } from "react-hook-form";

import {
  PollDetailsData,
  PollDetailsForm,
} from "@/components/forms/poll-details-form";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";

export function EditDetailsForm() {
  const { poll } = usePoll();
  const urlId = poll.adminUrlId;
  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();

  const form = useForm<PollDetailsData>({
    defaultValues: {
      title: poll.title,
      location: poll.location ?? "",
      description: poll.description ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          //submit
          updatePollMutation({ urlId, ...data });
          form.reset({
            title: data.title,
            location: data.location,
            description: data.description,
          });
        })}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="event" />
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="editDetailsDescription"
                defaults="Change the details of your event."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PollDetailsForm />
          </CardContent>
          <CardFooter>
            <Button
              disabled={!form.formState.isDirty}
              type="submit"
              loading={isUpdating}
              variant="primary"
            >
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
