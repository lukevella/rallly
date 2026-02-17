"use client";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import type React from "react";
import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useUnmount } from "react-use";
import { PollSettingsForm } from "@/components/forms/poll-settings";
import { useUser } from "@/components/user-provider";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import type { NewEventData } from "./forms";
import { PollDetailsForm, PollOptionsForm } from "./forms";

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
  const { t } = useTranslation();
  const { createGuestIfNeeded } = useUser();
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

  const makePoll = trpc.polls.make.useMutation();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (formData) => {
          const title = required(formData?.title.trim());
          await createGuestIfNeeded();
          const res = await makePoll.mutateAsync({
            title: title,
            location: formData?.location?.trim(),
            description: formData?.description?.trim(),
            timeZone: formData?.timeZone,
            hideParticipants: formData?.hideParticipants,
            disableComments: formData?.disableComments,
            hideScores: formData?.hideScores,
            requireParticipantEmail: formData?.requireParticipantEmail,
            options: required(formData?.options).map((option) => ({
              startDate: option.type === "date" ? option.date : option.start,
              endDate: option.type === "timeSlot" ? option.end : undefined,
            })),
          });

          if (res.ok) {
            router.push(`/poll/${res.data.id}`);
          } else {
            toast.error(
              t("inappropriateContent", {
                defaultValue: "Inappropriate content",
              }),
              {
                action: {
                  label: t("learnMore", { defaultValue: "Learn more" }),
                  onClick: () => {
                    window.open(
                      "https://support.rallly.co/guide/content-moderation",
                      "_blank",
                    );
                  },
                },
              },
            );
          }
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
            loading={form.formState.isSubmitting}
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
