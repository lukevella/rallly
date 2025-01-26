"use client";
import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useUnmount } from "react-use";

import { PollSettingsForm } from "@/components/forms/poll-settings";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/trpc/client";
import { setCookie } from "@/utils/cookies";

import type { NewEventData } from "./forms";
import { PollDetailsForm, PollOptionsForm } from "./forms";
import { signIn, useSession } from "next-auth/react";

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
  const { user } = useUser();
  const session = useSession();
  const form = useForm<NewEventData>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      view: "month",
      options: [],
      hideScores: false,
      hideParticipants: false,
      disableComments: false,
      duration: 60,
    },
  });

  const { clear } = useFormPersist("new-poll", {
    watch: form.watch,
    setValue: form.setValue,
  });

  useUnmount(clear);

  const posthog = usePostHog();
  const createPoll = trpc.polls.create.useMutation({
    networkMode: "always",
    onMutate: async () => {
      if (session.status === "unauthenticated") {
        await signIn("guest", {
          redirect: false,
        });
      }
    },
  });

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
              hideParticipants: formData?.hideParticipants,
              disableComments: formData?.disableComments,
              hideScores: formData?.hideScores,
              requireParticipantEmail: formData?.requireParticipantEmail,
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
                  tier: user.tier,
                  $set: {
                    last_poll_created_at: new Date().toISOString(),
                  },
                });
                router.push(`/poll/${res.id}`);
              },
            },
          );
        })}
      >
        <div className="space-y-4">
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

          <PollOptionsForm />

          <PollSettingsForm />
          <hr />
          <Button
            loading={
              form.formState.isSubmitting || form.formState.isSubmitSuccessful
            }
            size="lg"
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="createPoll" defaults="Create poll" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
