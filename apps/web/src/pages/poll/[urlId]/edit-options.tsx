import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { Card } from "@/components/card";
import PollOptionsForm from "@/components/forms/poll-options-form";
import { getPollLayout } from "@/components/layouts/poll-layout";
import { useModalContext } from "@/components/modal/modal-provider";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { encodeDateOption } from "@/utils/date-time-utils";
import { getStaticTranslations } from "@/utils/with-page-translations";

const convertOptionToString = (option: { start: Date; duration: number }) => {
  const start = dayjs(option.start).utc();
  return option.duration === 0
    ? start.format("YYYY-MM-DD")
    : `${start.format("YYYY-MM-DDTHH:mm:ss")}/${start
        .add(option.duration, "minute")
        .format("YYYY-MM-DDTHH:mm:ss")}`;
};

const Page: NextPageWithLayout = () => {
  const { poll, getParticipantsWhoVotedForOption } = usePoll();
  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const { t } = useTranslation();
  const modalContext = useModalContext();
  const router = useRouter();
  const redirectBackToPoll = () => {
    router.replace(`/poll/${poll.id}`);
  };
  return (
    <Card className="mx-auto max-w-4xl" fullWidthOnMobile={true}>
      <PollOptionsForm
        className="p-3 sm:py-5 sm:px-6"
        name="pollOptions"
        title={poll.title}
        defaultValues={{
          navigationDate: dayjs(poll.options[0].start)
            .utc()
            .format("YYYY-MM-DD"),
          options: poll.options.map((option) => {
            const start = dayjs(option.start).utc();
            return option.duration > 0
              ? {
                  type: "timeSlot",
                  start: start.format("YYYY-MM-DDTHH:mm:ss"),
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
        }}
        onSubmit={(data) => {
          const encodedOptions = data.options.map(encodeDateOption);
          const optionsToDelete = poll.options.filter((option) => {
            return !encodedOptions.includes(convertOptionToString(option));
          });

          const optionsToAdd = encodedOptions.filter(
            (encodedOption) =>
              !poll.options.find(
                (o) => convertOptionToString(o) === encodedOption,
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
              description: (
                <Trans
                  i18nKey="deletingOptionsWarning"
                  components={{ b: <strong /> }}
                />
              ),
              onOk,
              okButtonProps: {
                type: "danger",
              },
              okText: t("delete"),
              cancelText: t("cancel"),
            });
          } else {
            onOk();
          }
        }}
      />
      <div className="flex justify-end gap-2 bg-gray-50 p-3">
        <Button onClick={redirectBackToPoll}>
          <Trans i18nKey="cancel" />
        </Button>
        <Button
          type="submit"
          loading={isUpdating}
          form="pollOptions"
          variant="primary"
        >
          <Trans i18nKey="save" />
        </Button>
      </div>
    </Card>
  );
};

Page.getLayout = getPollLayout;

export const getStaticPaths = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: "blocking", //indicates the type of fallback
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
