import { trpc } from "@rallly/backend";
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

import { Trans } from "@/components/trans";
import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { usePostHog } from "@/utils/posthog";

import { NewEventData, PollDetailsForm, PollOptionsForm } from "./forms";
import { useUser } from "./user-provider";

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

  const session = useUser();

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
                <Trans i18nKey="event">Event</Trans>
              </CardTitle>
              <CardDescription>
                <Trans i18nKey="describeYourEvent">
                  Describe what your event is about
                </Trans>
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
          {/* <hr />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-x-2">
                <CardTitle>Advanced</CardTitle>
                <Badge>Pro</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="hideParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start justify-between gap-x-4">
                        <div className="grid gap-2 pt-0.5">
                          <Label htmlFor="allDay">Hide participants</Label>
                          <p className="text-muted-foreground text-sm">
                            Only you will be able to see the participant names
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card> */}
          <hr />
          <Button
            loading={form.formState.isSubmitting || form.formState.isSubmitted}
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
