import { trpc } from "@rallly/backend";
import { withAuthIfRequired, withSessionSsr } from "@rallly/backend/next";
import {
  ArrowRightIcon,
  ChartSquareBarIcon,
  InboxIcon,
  PlusSmIcon,
} from "@rallly/icons";
import { createColumnHelper } from "@tanstack/react-table";
import clsx from "clsx";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";

import { getStandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

type PollTableRow = {
  id: string;
  title: string;
  createdAt: Date;
  closed: boolean;
  adminUrlId: string;
  participantUrlId: string;
  participants: { id: string; name: string }[];
};

const columnHelper = createColumnHelper<PollTableRow>();

const EmptyState = () => {
  return (
    <div className="p-8 lg:p-36">
      <div className="mx-auto max-w-lg rounded-md border-2 border-dashed border-gray-300 p-8 text-center text-gray-600">
        <div className="mb-4">
          <InboxIcon className="inline-block h-10 text-gray-500" />
        </div>
        <h3>
          <Trans defaults="No polls" />
        </h3>
        <p>
          <Trans defaults="Get started by creating a new poll." />
        </p>
        <div className="mt-6">
          <Link href="/new" className="btn-primary">
            <PlusSmIcon className="-ml-0.5 h-5" />
            <Trans defaults="New Poll" i18nKey="newPoll" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  const { data = [] } = trpc.polls.list.useQuery();
  const { t } = useTranslation();

  return (
    <div>
      <Head>
        <title>{t("myPolls")}</title>
      </Head>
      <TopBar className="flex items-center justify-between gap-4 p-3">
        <TopBarTitle
          title={<Trans i18nKey="myPolls" defaults="My Polls" />}
          icon={ChartSquareBarIcon}
        />
        <div>
          {data.length > 0 ? (
            <Link className="btn-primary" href="/new">
              <PlusSmIcon className="-ml-0.5 h-5" />
              <Trans defaults="New Poll" i18nKey="newPoll" />
            </Link>
          ) : null}
        </div>
      </TopBar>
      <div>
        {data.length > 0 ? (
          <Table
            className="bg-white"
            layout="auto"
            data={data}
            columns={[
              columnHelper.accessor("title", {
                header: () => <Trans i18nKey="title" />,
                size: 300,
                cell: (info) => (
                  <Link
                    href={`/poll/${info.row.original.id}`}
                    className="group flex gap-4 p-1"
                  >
                    <ChartSquareBarIcon className="text-primary-600 mt-0.5 h-8 shrink-0" />
                    <div>
                      <div className="group-hover:text-primary-600 group inline-flex min-w-0 items-center gap-2 pr-4 font-medium">
                        <span className="truncate">{info.getValue()}</span>
                        <ArrowRightIcon
                          className={clsx(
                            "h-4 transition-all",
                            "opacity-0 group-hover:opacity-100",
                            "-translate-x-4 group-hover:translate-x-0",
                            "group-focus:translate-x-1",
                          )}
                        />
                      </div>
                      <div className="text-gray-500">
                        {dayjs(info.row.original.createdAt).fromNow()}
                      </div>
                    </div>
                  </Link>
                ),
              }),
              columnHelper.accessor("participants", {
                header: () => (
                  <Trans i18nKey="participants" defaults="Particpants" />
                ),
                size: 160,
                cell: (info) => (
                  <ParticipantAvatarBar
                    participants={info.getValue()}
                    max={5}
                  />
                ),
              }),

              columnHelper.accessor("closed", {
                header: () => <Trans i18nKey="status" defaults="Status" />,
                size: 70,
                cell: (info) =>
                  info.getValue() ? (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200">
                      <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
                      <Trans i18nKey="closed" defaults="Closed" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-600 ring-2 ring-green-50" />
                      <Trans i18nKey="open" defaults="Open" />
                    </span>
                  ),
              }),
              // columnHelper.display({
              //   id: "actions",
              //   size: 70,
              //   cell: () => (
              //     <div className="text-right">
              //       <Button icon={<DotsHorizontalIcon />} />
              //     </div>
              //   ),
              // }),
            ]}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

Page.getLayout = getStandardLayout;

export default Page;

export const getServerSideProps = withSessionSsr([
  withAuthIfRequired,
  withPageTranslations(),
]);
