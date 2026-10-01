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
import { Form } from "@rallly/ui/form";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/components/link";
import { useModalContext } from "@/components/modal/modal-provider";
import type { ConferencingOptions } from "@/features/conferencing/components/conferencing-field";
import {
  toConferencingFormValues,
  toPollConferencing,
} from "@/features/conferencing/components/conferencing-field";
import { useParticipants, usePoll } from "@/features/poll/client";
import { PollDetailsForm } from "@/features/poll/components/forms/poll-details-form";
import PollOptionsForm from "@/features/poll/components/forms/poll-options-form/poll-options-form";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type {
  NewEventData,
  PollOptionsData,
} from "@/features/poll/components/forms/types";
import { useUpdatePollMutation } from "@/features/poll/components/mutations";
import { SelectedOptionsCount } from "@/features/poll/components/selected-options-count";
import type { PollDetails } from "@/features/poll/types";
import { filterParticipantsByVote } from "@/features/poll/utils";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import {
  addMinutesToWallTime,
  instantToWallTime,
} from "@/lib/datetime/wall-time";
import {
  encodeDateOption,
  getBrowserTimeZone,
} from "@/lib/utils/date-time-utils";

const toPollWallTime = (value: Date, timeZone: string | null) =>
  instantToWallTime(value, timeZone ?? "UTC");

const encodeStoredOption = (
  option: { startTime: Date; duration: number },
  timeZone: string | null,
) => {
  const start = toPollWallTime(option.startTime, timeZone);
  return option.duration === 0
    ? start.slice(0, 10)
    : `${start}/${addMinutesToWallTime(start, option.duration)}`;
};

function getDefaultValues(poll: PollDetails): NewEventData {
  const firstDate = toPollWallTime(
    poll.options[0]?.startTime ?? new Date(),
    poll.timeZone,
  );

  return {
    title: poll.title,
    location: poll.location ?? "",
    description: poll.description ?? "",
    ...toConferencingFormValues(poll.conferencing),
    navigationDate: firstDate.slice(0, 10),
    view: "month",
    options: poll.options.map((option) => {
      const start = toPollWallTime(option.startTime, poll.timeZone);
      return option.duration > 0
        ? {
            type: "timeSlot" as const,
            start,
            end: addMinutesToWallTime(start, option.duration),
          }
        : { type: "date" as const, date: start.slice(0, 10) };
    }),
    timeZone: poll.timeZone ?? "",
    // A timed poll with no stored zone was locked to a single wall-clock time.
    // All-day polls are neutral (lock doesn't apply).
    lockTimeZone:
      !poll.timeZone && poll.options.some((option) => option.duration > 0),
    allDay:
      poll.options.length > 0 &&
      poll.options.every((option) => option.duration === 0),
    duration: poll.options[0]?.duration || 60,
    hideParticipants: poll.hideParticipants,
    hideScores: poll.hideScores,
    enableComments: !poll.disableComments,
    allowTentativeVotes: poll.allowTentativeVotes,
    requireParticipantEmail: poll.requireParticipantEmail,
  };
}

/**
 * What changed in the dates, or null when the options and their time zone
 * frame are as stored.
 */
function getDateChanges({
  poll,
  data,
  fallbackTimeZone,
}: {
  poll: PollDetails;
  data: PollOptionsData;
  fallbackTimeZone: string;
}) {
  // The submitted frame for the options: null when locked or all-day
  // (floating), else the organizer's zone.
  const timeZone =
    !data.lockTimeZone && !data.allDay
      ? data.timeZone || fallbackTimeZone
      : null;

  const encodedOptions = data.options.map(encodeDateOption);

  // When the frame changes the stored instants no longer match it, so every
  // option is re-stored from the form's wall-clock under the new frame, which
  // keeps the displayed times put (3pm stays 3pm). Otherwise only what the
  // organizer edited is touched.
  const frameChanged = timeZone !== poll.timeZone;

  const optionsToDelete = frameChanged
    ? poll.options
    : poll.options.filter(
        (option) =>
          !encodedOptions.includes(encodeStoredOption(option, poll.timeZone)),
      );

  const optionsToAdd = frameChanged
    ? encodedOptions
    : encodedOptions.filter(
        (encoded) =>
          !poll.options.some(
            (option) => encodeStoredOption(option, poll.timeZone) === encoded,
          ),
      );

  if (
    !frameChanged &&
    optionsToDelete.length === 0 &&
    optionsToAdd.length === 0
  ) {
    return null;
  }

  return { timeZone, optionsToDelete, optionsToAdd };
}

const detailFields = [
  "title",
  "location",
  "description",
  "conferencingProvider",
  "conferencingUrl",
  "conferencingLabel",
] as const;

const settingFields = [
  "hideParticipants",
  "hideScores",
  "enableComments",
  "allowTentativeVotes",
  "requireParticipantEmail",
] as const;

/**
 * The whole poll as one form, laid out like the create page and filled with
 * the poll's current values. Save sends only what changed.
 */
export function EditPoll({
  conferencing,
  returnHref,
}: {
  conferencing: ConferencingOptions | null;
  returnHref: string;
}) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const { user } = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  const modalContext = useModalContext();
  const update = useUpdatePollMutation();

  // The answer set is locked once a response uses the tentative vote, so
  // those votes stay re-saveable by their owner.
  const hasTentativeVotes = participants.some((participant) =>
    participant.votes.some((vote) => vote.type === "ifNeedBe"),
  );
  const hasVotes = participants.some(
    (participant) => participant.votes.length > 0,
  );

  const [defaultValues] = React.useState(() => getDefaultValues(poll));
  const form = useForm<NewEventData>({ defaultValues });

  const onSubmit = form.handleSubmit((data) => {
    const input: Parameters<typeof update.mutate>[0] = { pollId: poll.id };

    // Compared against the starting values rather than dirtyFields: the
    // Remove buttons clear a field with setValue, which doesn't mark it dirty.
    const isChanged = (
      field: (typeof detailFields)[number] | (typeof settingFields)[number],
    ) => (data[field] ?? "") !== (defaultValues[field] ?? "");

    const detailsChanged = detailFields.some(isChanged);
    if (detailsChanged) {
      input.title = data.title;
      input.location = data.location;
      input.description = data.description;
      input.conferencing = toPollConferencing(data) ?? null;
    }

    const dateChanges = getDateChanges({
      poll,
      data,
      fallbackTimeZone: user?.timeZone || getBrowserTimeZone(),
    });
    if (dateChanges) {
      input.timeZone = dateChanges.timeZone;
      input.optionsToDelete = dateChanges.optionsToDelete.map(({ id }) => id);
      input.optionsToAdd = dateChanges.optionsToAdd;
    }

    const settingsChanged = settingFields.some(isChanged);
    if (settingsChanged) {
      input.hideParticipants = data.hideParticipants;
      input.hideScores = data.hideScores;
      input.disableComments = !data.enableComments;
      input.allowTentativeVotes = data.allowTentativeVotes;
      input.requireParticipantEmail = data.requireParticipantEmail;
    }

    if (!detailsChanged && !dateChanges && !settingsChanged) {
      router.push(returnHref);
      return;
    }

    const submit = () => {
      update.mutate(input, {
        onSuccess: (res) => {
          if (res.ok) {
            router.push(returnHref);
          }
        },
      });
    };

    const deletesVotedOptions = dateChanges?.optionsToDelete.some(
      (option) =>
        filterParticipantsByVote(participants, option.id, "yes").length > 0,
    );

    if (deletesVotedOptions) {
      modalContext.render({
        title: t("areYouSure", { defaultValue: "Are you sure?" }),
        content: (
          <Trans
            i18nKey="deletingOptionsWarning"
            defaults="You are deleting options that participants have voted for. Their votes will also be deleted."
            components={{ b: <strong /> }}
          />
        ),
        onOk: submit,
        okButtonProps: { variant: "destructive" },
        okText: t("delete"),
        cancelText: t("cancel"),
      });
    } else {
      submit();
    }
  });

  return (
    <Form {...form}>
      <form id="edit-poll" onSubmit={onSubmit} className="space-y-4">
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
            <PollDetailsForm conferencing={conferencing} />
          </CardContent>
        </Card>
        <PollOptionsForm disableTimeZoneChange={hasVotes} />
        <PollSettingsForm hasTentativeVotes={hasTentativeVotes} />
        <div className="sticky bottom-0 z-20 flex justify-center pt-2 pb-6">
          <div className="flex w-full max-w-md items-center justify-between gap-x-4 rounded-full border border-popover-border bg-popover py-2 pr-2 pl-5 shadow-2xl shadow-black/40">
            <p className="min-w-0 truncate text-muted-foreground text-sm">
              <SelectedOptionsCount />
            </p>
            <div className="flex shrink-0 items-center gap-x-2">
              <Link
                href={returnHref}
                className={buttonVariants({
                  variant: "ghost",
                  className: "rounded-full",
                })}
              >
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="rounded-full px-4"
                loading={update.isPending}
              >
                <Trans i18nKey="saveChanges" defaults="Save changes" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
