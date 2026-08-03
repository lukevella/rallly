"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { badgeVariants } from "@rallly/ui/badge";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { toast } from "@rallly/ui/sonner";
import { shortUrl } from "@rallly/utils/absolute-url";
import { CheckIcon, CopyIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm, useFormContext } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useCopyToClipboard } from "react-use";
import { PollDetailsForm } from "@/features/poll/components/forms/poll-details-form";
import PollOptionsForm from "@/features/poll/components/forms/poll-options-form/poll-options-form";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { NewEventData } from "@/features/poll/components/forms/types";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import { trpc } from "@/trpc/client";

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

const GuestModeBadge = () => {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              badgeVariants(),
              "cursor-pointer hover:bg-card-accent focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          />
        }
      >
        <Trans i18nKey="guest" defaults="Guest" />
      </PopoverTrigger>
      <PopoverContent align="end" className="max-w-xs">
        <div>
          <h3 className="font-medium text-sm">
            <Trans i18nKey="createPollGuestModeTitle" defaults="Guest mode" />
          </h3>
          <p className="mt-1 text-pretty text-muted-foreground text-sm">
            <Trans
              i18nKey="createPollGuestModeDescription"
              defaults="Guest polls can only be managed from the browser they were created in. Log in to manage them from any device."
            />
          </p>
        </div>
        <Link
          href="/login?redirectTo=/new"
          className={cn(buttonVariants(), "mt-3 w-full")}
        >
          <Trans i18nKey="createPollGuestModeLogin" defaults="Log in" />
        </Link>
      </PopoverContent>
    </Popover>
  );
};

const CreatePollActions = ({
  createdPollId,
}: {
  createdPollId: string | null;
}) => {
  const form = useFormContext<NewEventData>();

  if (createdPollId) {
    return (
      <output className="flex h-9 items-center gap-x-1.5 rounded-lg bg-green-600/10 px-2.5 font-medium text-green-600 text-sm dark:bg-green-500/10 dark:text-green-500">
        <CheckIcon className="size-4 shrink-0" />
        <Trans i18nKey="createPollFooterCreated" defaults="Created" />
      </output>
    );
  }

  return (
    <Button
      form="create-poll"
      loading={form.formState.isSubmitting}
      type="submit"
      variant="primary"
    >
      {form.formState.isSubmitting ? (
        <Trans i18nKey="createPollFooterCreating" defaults="Creating…" />
      ) : (
        <Trans i18nKey="create" defaults="Create" />
      )}
    </Button>
  );
};

export const CreatePoll = ({ nav }: { nav?: React.ReactNode }) => {
  const { t } = useTranslation();
  const { user, createGuestIfNeeded } = useUser();
  const isLoggedIn = !!user && !user.isGuest;
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
      enableComments: false,
      duration: 60,
      lockTimeZone: false,
      allDay: false,
    },
  });

  const { clear } = useFormPersist("new-poll", {
    watch: form.watch,
    setValue: form.setValue,
  });

  const makePoll = trpc.polls.make.useMutation();

  return (
    <Form {...form}>
      <header className="sticky top-0 z-20 bg-gray-100/90 p-3 backdrop-blur-md xl:bg-transparent xl:backdrop-blur-none dark:bg-gray-900/90 dark:xl:bg-transparent">
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex min-w-0 flex-1 items-center">{nav}</div>
          <div className="flex shrink-0 items-center gap-x-4">
            {!isLoggedIn ? <GuestModeBadge /> : null}
            <CreatePollActions createdPollId={createdPollId} />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-3 pb-8 lg:pt-6"
      >
        <form
          id="create-poll"
          onSubmit={form.handleSubmit(async (formData) => {
            const title = required(formData?.title.trim());
            await createGuestIfNeeded();
            const res = await makePoll.mutateAsync({
              title: title,
              location: formData?.location?.trim(),
              description: formData?.description?.trim(),
              // Attach a time zone (times convert per viewer) unless the organizer
              // locked it to a single wall-clock time or the poll is all-day.
              // Fall back to the organizer's zone so a converting poll is always
              // anchored to a concrete zone.
              timeZone:
                !formData?.lockTimeZone && !formData?.allDay
                  ? formData?.timeZone || getBrowserTimeZone()
                  : null,
              hideParticipants: formData?.hideParticipants,
              disableComments: !formData?.enableComments,
              hideScores: formData?.hideScores,
              requireParticipantEmail: formData?.requireParticipantEmail,
              options: required(formData?.options).map((option) => ({
                startDate: option.type === "date" ? option.date : option.start,
                endDate: option.type === "timeSlot" ? option.end : undefined,
              })),
            });

            if (res.ok) {
              // The persist hook re-saves on every render, so clearing storage
              // alone is not enough — reset the form so defaults get persisted
              clear();
              form.reset();
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
          </div>
        </form>
      </main>
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
          <InputGroup className="w-full">
            <InputGroupInput
              className="text-center"
              value={shortUrl(`/invite/${createdPollId}`)}
              readOnly
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                disabled={didCopy}
                aria-label={
                  didCopy
                    ? t("copied", { defaultValue: "Copied" })
                    : t("copyLink", { defaultValue: "Copy link" })
                }
                onClick={() => {
                  copy(shortUrl(`/invite/${createdPollId}`));
                  setDidCopy(true);
                  setTimeout(() => setDidCopy(false), 2000);
                  posthog?.capture("poll_creation:invite_link_copy");
                }}
              >
                {didCopy ? <CheckIcon /> : <CopyIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Link
              href={`/poll/${createdPollId}`}
              className={buttonVariants({ variant: "primary" })}
              onClick={() => {
                posthog?.capture("poll_creation:manage_button_click");
              }}
            >
              <Trans i18nKey="manage" defaults="Manage" />
            </Link>

            <Link
              href={`/invite/${createdPollId}`}
              prefetch={false}
              className={buttonVariants()}
              onClick={() => {
                posthog?.capture("poll_creation:view_button_click");
              }}
            >
              <Trans i18nKey="viewPoll" defaults="View poll" />
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};
