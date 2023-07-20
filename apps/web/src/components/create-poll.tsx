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
      allDay: true,
    },
  });

  const posthog = usePostHog();
  const queryClient = trpc.useContext();
  const createPoll = trpc.polls.create.useMutation();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (formData) => {
          const title = required(formData?.eventDetails?.title);

          await createPoll.mutateAsync(
            {
              title: title,
              location: formData?.eventDetails?.location,
              description: formData?.eventDetails?.description,
              user: session.user.isGuest
                ? {
                    name: required(formData?.userDetails?.name),
                    email: required(formData?.userDetails?.contact),
                  }
                : undefined,
              timeZone: formData?.options?.timeZone,
              options: required(formData?.options?.options).map((option) => ({
                startDate: option.type === "date" ? option.date : option.start,
                endDate: option.type === "timeSlot" ? option.end : undefined,
              })),
            },
            {
              onSuccess: (res) => {
                posthog?.capture("created poll", {
                  pollId: res.id,
                  numberOfOptions: formData.options?.options?.length,
                  optionsView: formData?.options?.view,
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
                <Trans i18nKey="newPoll" />
              </CardTitle>
              <CardDescription>
                <Trans
                  i18nKey="createPollDescription"
                  defaults="Create an event and invite participants to vote on the best time to meet."
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PollDetailsForm />
            </CardContent>
          </Card>

          <hr />
          <Button size="lg" type="submit" className="w-full" variant="primary">
            <Trans i18nKey="createPoll" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
