import { trpc } from "@rallly/backend";
import {
  InboxIcon,
  PauseCircleIcon,
  PlusIcon,
  RadioIcon,
  VoteIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { createColumnHelper } from "@tanstack/react-table";
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
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

type PollTableRow = {
  id: string;
  title: string;
  createdAt: Date;
  selectedOptionId: string | null;
  closed: boolean;
  adminUrlId: string;
  participantUrlId: string;
  participants: { id: string; name: string }[];
  options: { id: string; start: Date }[];
};

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

const PollCard = ({
  date,
  paused,
  createdAt,
  pollId,
  title,
  participants,
}: {
  date?: Date;
  createdAt: Date;
  paused: boolean;
  pollId: string;
  title: string;
  participants: { name: string }[];
}) => {
  return (
    <div className="flex flex-col justify-between gap-y-4 gap-x-4 rounded-md border bg-white p-4 sm:flex-row sm:items-start">
      <div className="flex gap-x-4">
        <div>
          {date ? (
            <DateIcon date={dayjs(date)} />
          ) : paused ? (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-md border bg-gray-50">
              <PauseCircleIcon className="h-5 w-5 text-gray-500" />
            </div>
          ) : (
            <div className="bg-primary-50 border-primary-100 inline-flex h-14 w-14 items-center justify-center rounded-md border">
              <RadioIcon className="text-primary-500 h-5 w-5" />
            </div>
          )}
        </div>
        <div className="pt-0.5">
          <Link
            href={`/poll/${pollId}`}
            className="font-semibold hover:underline"
          >
            {title}
          </Link>
          <div className="text-muted-foreground text-sm">
            {dayjs(createdAt).fromNow()}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <ParticipantAvatarBar participants={participants} max={5} />
      </div>
    </div>
  );
};

const PollList = ({ data }: { data: PollTableRow[] }) => {
  return (
    <div className="grid gap-4">
      {data.map((poll) => {
        const selectedOption = poll.options.find(
          (option) => option.id === poll.selectedOptionId,
        );
        return (
          <PollCard
            key={poll.id}
            date={selectedOption?.start}
            createdAt={poll.createdAt}
            paused={poll.closed}
            pollId={poll.id}
            title={poll.title}
            participants={poll.participants}
          />
        );
      })}
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  const { data } = trpc.polls.list.useQuery();
  const { t } = useTranslation();

  if (!data) {
    return null;
  }

  const pending = data.filter((poll) => !poll.selectedOptionId);
  const closed = data.filter((poll) => !!poll.selectedOptionId);

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
        <Container className="mx-auto px-0 sm:py-8">
          {data.length > 0 ? (
            <div className="mx-auto grid max-w-4xl gap-4">
              {data.map((poll) => {
                const selectedOption = poll.options.find(
                  (option) => option.id === poll.selectedOptionId,
                );
                return (
                  <PollCard
                    key={poll.id}
                    date={selectedOption?.start}
                    createdAt={poll.createdAt}
                    paused={poll.closed}
                    pollId={poll.id}
                    title={poll.title}
                    participants={poll.participants}
                  />
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
