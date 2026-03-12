"use client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Form } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { shortUrl } from "@rallly/utils/absolute-url";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useCopyToClipboard, useUnmount } from "react-use";
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
  const { t } = useTranslation();
  const { createGuestIfNeeded } = useUser();
  const [createdPollId, setCreatedPollId] = React.useState<string | null>(null);
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

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
            setCreatedPollId(res.data.id);
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
            size="xl"
            type="submit"
            className="w-full"
            variant="primary"
          >
            {form.formState.isSubmitting ? (
              <Trans i18nKey="creatingPoll" defaults="Creating poll..." />
            ) : (
              <Trans i18nKey="createPoll" defaults="Create poll" />
            )}
          </Button>
        </div>
      </form>
      <Dialog open={!!createdPollId}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-2">
                <div className="inline-flex size-10 items-center justify-center rounded-full bg-green-500/10">
                  <CheckIcon className="size-4 text-green-500" />
                </div>
              </div>
              <div>
                <DialogTitle>
                  <Trans
                    i18nKey="createPollPollCreated"
                    defaults="Poll created"
                  />
                </DialogTitle>
                <DialogDescription>
                  <Trans
                    i18nKey="inviteParticipantsDescription"
                    defaults="Copy and share the invite link to start gathering responses from your participants."
                  />
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Input
            className="w-full text-center"
            value={shortUrl(`/invite/${createdPollId}`)}
            readOnly
          />
          <DialogFooter className="grid gap-2 sm:grid-cols-2">
            <Link
              target="_blank"
              href={`/invite/${createdPollId}`}
              className={buttonVariants()}
            >
              <Trans i18nKey="viewPoll" defaults="View poll" />
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
            <Button
              disabled={didCopy}
              onClick={() => {
                copy(shortUrl(`/invite/${createdPollId}`));
                setDidCopy(true);
                setTimeout(() => setDidCopy(false), 2000);
              }}
            >
              {didCopy ? (
                <>
                  <CheckIcon data-icon="inline-start" />
                  <Trans i18nKey="copied" defaults="Copied" />
                </>
              ) : (
                <>
                  <CopyIcon data-icon="inline-start" />
                  <Trans i18nKey="copyLink" defaults="Copy link" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};
