"use client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useModalContext } from "@/components/modal/modal-provider";
import PollOptionsForm from "@/features/poll/components/forms/poll-options-form/poll-options-form";
import { useUpdatePollMutation } from "@/features/poll/components/mutations";
import {
  filterParticipantsByVote,
  useParticipants,
} from "@/features/poll/components/participants-provider";
import { usePoll } from "@/features/poll/components/poll-context";
import { Trans, useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import {
  encodeDateOption,
  getBrowserTimeZone,
} from "@/lib/utils/date-time-utils";

const convertOptionToString = (
  option: { startTime: Date; duration: number },
  timeZone: string | null,
) => {
  let start = dayjs(option.startTime);
  if (timeZone) {
    start = start.tz(timeZone);
  } else {
    start = start.utc();
  }
  return option.duration === 0
    ? start.format("YYYY-MM-DD")
    : `${start.format("YYYY-MM-DDTHH:mm:ss")}/${start
        .add(option.duration, "minute")
        .format("YYYY-MM-DDTHH:mm:ss")}`;
};

const Page = () => {
  const { poll } = usePoll();
  const { participants } = useParticipants();
  const hasVotes = participants.some(
    (participant) => participant.votes.length > 0,
  );
  const { mutate: updatePollMutation, isPending: isUpdating } =
    useUpdatePollMutation();
  const { t } = useTranslation();
  const modalContext = useModalContext();
  const router = useRouter();
  const pollLink = `/poll/${poll.id}`;

  const redirectBackToPoll = () => {
    router.push(pollLink);
  };

  let firstDate = dayjs(poll.options[0]?.startTime);

  if (poll.timeZone) {
    firstDate = firstDate.tz(poll.timeZone);
  } else {
    firstDate = firstDate.utc();
  }

  const form = useForm({
    defaultValues: {
      navigationDate: firstDate.format("YYYY-MM-DD"),
      view: "month" as const,
      options: poll.options.map((option) => {
        let start = dayjs(option.startTime);
        if (poll.timeZone) {
          start = start.tz(poll.timeZone);
        } else {
          start = start.utc();
        }
        return option.duration > 0
          ? {
              type: "timeSlot" as const,
              start: start.format("YYYY-MM-DDTHH:mm:ss"),
              duration: option.duration,
              end: start
                .add(option.duration, "minute")
                .format("YYYY-MM-DDTHH:mm:ss"),
            }
          : {
              type: "date" as const,
              date: start.format("YYYY-MM-DD"),
            };
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
    },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          // The submitted timeZone frame for the options: null when locked or
          // all-day (floating), else the organizer's zone.
          const submittedTimeZone =
            !data.lockTimeZone && !data.allDay
              ? data.timeZone || getBrowserTimeZone()
              : null;

          const encodedOptions = data.options.map(encodeDateOption);

          // When the timezone frame changes (e.g. the organizer toggled the
          // lock), the stored instants no longer match the frame, so re-store
          // every option from the form's wall-clock under the new frame — this
          // keeps the displayed times put (3pm stays 3pm). When the frame is
          // unchanged, diff normally so we only touch what the user edited.
          const frameChanged = submittedTimeZone !== poll.timeZone;

          const optionsToDelete = frameChanged
            ? poll.options
            : poll.options.filter(
                (option) =>
                  !encodedOptions.includes(
                    convertOptionToString(option, poll.timeZone),
                  ),
              );

          const optionsToAdd = frameChanged
            ? encodedOptions
            : encodedOptions.filter(
                (encodedOption) =>
                  !poll.options.find(
                    (o) =>
                      convertOptionToString(o, poll.timeZone) === encodedOption,
                  ),
              );

          const onOk = () => {
            updatePollMutation(
              {
                pollId: poll.id,
                timeZone: submittedTimeZone,
                optionsToDelete: optionsToDelete.map(({ id }) => id),
                optionsToAdd,
              },
              {
                onSuccess: (res) => {
                  if (res.ok) {
                    redirectBackToPoll();
                  }
                },
              },
            );
          };

          const optionsToDeleteThatHaveVotes = optionsToDelete.filter(
            (option) =>
              filterParticipantsByVote(participants, option.id, "yes").length >
              0,
          );

          if (optionsToDeleteThatHaveVotes.length > 0) {
            modalContext.render({
              title: t("areYouSure"),
              content: (
                <Trans
                  i18nKey="deletingOptionsWarning"
                  components={{ b: <strong /> }}
                />
              ),
              onOk,
              okButtonProps: {
                variant: "destructive",
              },
              okText: t("delete"),
              cancelText: t("cancel"),
            });
          } else {
            onOk();
          }
        })}
      >
        <PollOptionsForm disableTimeZoneChange={hasVotes}>
          <CardFooter className="justify-between">
            <Link href={pollLink} className={buttonVariants()}>
              <Trans i18nKey="cancel" />
            </Link>
            <Button type="submit" loading={isUpdating} variant="primary">
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </PollOptionsForm>
      </form>
    </Form>
  );
};

export default Page;
