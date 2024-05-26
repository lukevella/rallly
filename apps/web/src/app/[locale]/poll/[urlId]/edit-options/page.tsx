"use client";
import { Button } from "@rallly/ui/button";
import { CardFooter } from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";

import { PollOptionsData } from "@/components/forms";
import PollOptionsForm from "@/components/forms/poll-options-form";
import { useModalContext } from "@/components/modal/modal-provider";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { encodeDateOption } from "@/utils/date-time-utils";

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
  const { poll, getParticipantsWhoVotedForOption } = usePoll();
  const { mutate: updatePollMutation, isLoading: isUpdating } =
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

  const form = useForm<PollOptionsData>({
    defaultValues: {
      navigationDate: firstDate.format("YYYY-MM-DD"),
      view: "month",
      options: poll.options.map((option) => {
        let start = dayjs(option.startTime);
        if (poll.timeZone) {
          start = start.tz(poll.timeZone);
        } else {
          start = start.utc();
        }
        return option.duration > 0
          ? {
              type: "timeSlot",
              start: start.format("YYYY-MM-DDTHH:mm:ss"),
              duration: option.duration,
              end: start
                .add(option.duration, "minute")
                .format("YYYY-MM-DDTHH:mm:ss"),
            }
          : {
              type: "date",
              date: start.format("YYYY-MM-DD"),
            };
      }),
      timeZone: poll.timeZone ?? "",
      duration: poll.options[0]?.duration || 60,
    },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          const encodedOptions = data.options.map(encodeDateOption);
          const optionsToDelete = poll.options.filter((option) => {
            return !encodedOptions.includes(
              convertOptionToString(option, data.timeZone),
            );
          });

          const optionsToAdd = encodedOptions.filter(
            (encodedOption) =>
              !poll.options.find(
                (o) =>
                  convertOptionToString(o, data.timeZone) === encodedOption,
              ),
          );

          const onOk = () => {
            updatePollMutation(
              {
                urlId: poll.adminUrlId,
                timeZone: data.timeZone,
                optionsToDelete: optionsToDelete.map(({ id }) => id),
                optionsToAdd,
              },
              {
                onSuccess: redirectBackToPoll,
              },
            );
          };

          const optionsToDeleteThatHaveVotes = optionsToDelete.filter(
            (option) => getParticipantsWhoVotedForOption(option.id).length > 0,
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
        <PollOptionsForm disableTimeZoneChange={true}>
          <CardFooter className="justify-between">
            <Button asChild>
              <Link href={pollLink}>
                <Trans i18nKey="cancel" />
              </Link>
            </Button>
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
