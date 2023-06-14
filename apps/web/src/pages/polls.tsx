import { trpc } from "@rallly/backend";
import {
  InboxIcon,
  PauseCircleIcon,
  PlusIcon,
  RadioIcon,
  VoteIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";

import { Container } from "@/components/container";
import { DateIcon } from "@/components/date-icon";
import { getStandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { useDayjs } from "@/utils/dayjs";
import { getStaticTranslations } from "@/utils/with-page-translations";

const EmptyState = () => {
  return (
    <div className="p-8 lg:p-36">
      <div className="mx-auto max-w-lg rounded-md border-2 border-dashed border-gray-300 p-8 text-center text-gray-600">
        <div className="mb-4">
          <InboxIcon className="inline-block h-10 w-10 text-gray-500" />
        </div>
        <h3>
          <Trans defaults="No polls" />
        </h3>
        <p>
          <Trans defaults="Get started by creating a new poll." />
        </p>
        <div className="mt-6">
          <Button variant="primary" asChild={true}>
            <Link href="/new">
              <PlusIcon className="h-5 w-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  const { data } = trpc.polls.list.useQuery();
  const { t } = useTranslation();
  const { timeZone: targetTimeZone } = useDayjs();
  if (!data) {
    return null;
  }

  return (
    <div>
      <Head>
        <title>{t("polls")}</title>
      </Head>
      <TopBar className="flex items-center justify-between gap-4">
        <TopBarTitle title={<Trans i18nKey="polls" />} icon={VoteIcon} />
        <div>
          {data.length > 0 ? (
            <Button variant="primary" asChild={true}>
              <Link href="/new">
                <PlusIcon className="-ml-0.5 h-5 w-5" />
                <Trans defaults="New Poll" i18nKey="newPoll" />
              </Link>
            </Button>
          ) : null}
        </div>
      </TopBar>
      <div>
        <Container className="mx-auto p-3 sm:p-8">
          {data.length > 0 ? (
            <div className="mx-auto grid max-w-4xl gap-3 sm:gap-4">
              {data.map((poll) => {
                const selectedOption = poll.options.find(
                  (option) => option.id === poll.selectedOptionId,
                );

                const adjustTimeZone = (date: Date | dayjs.Dayjs) => {
                  return poll.timeZone && targetTimeZone
                    ? dayjs(date)
                        .utc()
                        .tz(poll.timeZone, true)
                        .tz(targetTimeZone)
                    : dayjs(date).utc();
                };

                const { title, id: pollId, createdAt, closed: paused } = poll;
                return (
                  <div
                    key={poll.id}
                    className="flex flex-col justify-between gap-y-4 gap-x-4 rounded-md border bg-white px-6 py-4 sm:flex-row sm:items-start"
                  >
                    <div className="flex gap-x-4">
                      <div className="-ml-2">
                        {selectedOption ? (
                          <DateIcon
                            date={adjustTimeZone(selectedOption.start)}
                          />
                        ) : paused ? (
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-gray-400">
                            <PauseCircleIcon className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-md border bg-blue-600">
                            <RadioIcon className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        {/* <div className="text-muted-foreground text-sm">
                          {selectedOption
                            ? selectedOption.duration > 0
                              ? `${adjustTimeZone(selectedOption.start).format(
                                  "LLL",
                                )} - ${adjustTimeZone(
                                  dayjs(selectedOption.start).add(
                                    selectedOption.duration,
                                    "minutes",
                                  ),
                                ).format("LT")}`
                              : adjustTimeZone(selectedOption.start).format(
                                  "LL",
                                )
                            : null}
                        </div> */}
                        <div>
                          <Link
                            href={`/poll/${pollId}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {title}
                          </Link>
                        </div>
                        <div className="text-muted-foreground">
                          {dayjs(createdAt).fromNow()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </Container>
      </div>
    </div>
  );
};

Page.getLayout = getStandardLayout;

export default Page;

export const getStaticProps = getStaticTranslations;
