import { trpc } from "@rallly/backend";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";

import { PollSettingsForm } from "@/components/forms/poll-settings";
import { Trans } from "@/components/trans";
import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { usePostHog } from "@/utils/posthog";

import { NewEventData, PollDetailsForm, PollOptionsForm } from "./forms";

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

export interface CreatePollPageProps {
  title?: string;
  location?: string;
  description?: string;
  view?: "week" | "month";
}

export const CreatePoll: React.FunctionComponent = () => {
  const router = useRouter();

  const form = useForm<NewEventData>({
    defaultValues: {
      view: "month",
      timeZone: getBrowserTimeZone(),
      options: [],
      hideParticipants: false,
      duration: 60,
    },
  });

  const posthog = usePostHog();
  const queryClient = trpc.useContext();
  const createPoll = trpc.polls.create.useMutation();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (formData) => {
          const title = required(formData?.title);

          await createPoll.mutateAsync(
            {
              title: title,
              location: formData?.location,
              description: formData?.description,
              timeZone: formData?.timeZone,
              options: required(formData?.options).map((option) => ({
                startDate: option.type === "date" ? option.date : option.start,
                endDate: option.type === "timeSlot" ? option.end : undefined,
              })),
            },
            {
              onSuccess: (res) => {
                posthog?.capture("created poll", {
                  pollId: res.id,
                  numberOfOptions: formData.options?.length,
                  optionsView: formData?.view,
                });
                queryClient.polls.list.invalidate();
                router.replace(`/poll/${res.id}`);
              },
            },
          );
        })}
      >
        <div className="mx-auto max-w-4xl space-y-4 p-2 sm:p-8">
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans i18nKey="event" defaults="Event" />
              </CardTitle>
              <CardDescription>
                <Trans
                  i18nKey="describeYourEvent"
                  defaults="Describe what your event is about"
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PollDetailsForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans i18nKey="calendar">Calendar</Trans>
              </CardTitle>
              <CardDescription>
                <Trans i18nKey="selectPotentialDates">
                  Select potential dates for your event
                </Trans>
              </CardDescription>
            </CardHeader>
            <PollOptionsForm />
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-x-2">
                <CardTitle>Advanced</CardTitle>
                <Badge>
                  <Trans i18nKey="planPro" />
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <PollSettingsForm />
            </CardContent>
          </Card>
          <hr />
          <Button
            loading={form.formState.isSubmitting}
            size="lg"
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="createPoll" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
