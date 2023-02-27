import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import * as React from "react";

import Calendar from "@/components/icons/calendar.svg";
import Pencil from "@/components/icons/pencil.svg";
import User from "@/components/icons/user.svg";

import { useDayjs } from "../utils/dayjs";
import { trpc } from "../utils/trpc";
import { EmptyState } from "./empty-state";
import { UserDetails } from "./profile/user-details";
import { useUser } from "./user-provider";

export const Profile: React.VoidFunctionComponent = () => {
  const { user } = useUser();
  const { dayjs } = useDayjs();

  const { t } = useTranslation("app");
  const { data: userPolls } = trpc.user.getPolls.useQuery();

  const createdPolls = userPolls?.polls;
  const router = useRouter();

  React.useEffect(() => {
    if (user.isGuest) {
      router.push("/profile");
    }
  }, [router, user.isGuest]);

  if (user.isGuest) {
    return null;
  }

  return (
    <div className="-mt-3 space-y-3 p-3 sm:space-y-4 sm:p-4">
      <Head>
        <title>
          {t("profileUser", {
            username: user.name,
          })}
        </title>
      </Head>
      <div className="flex gap-4 rounded-md border bg-white p-3 shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded border border-primary-200/50 bg-primary-50">
          <User className="h-7 text-primary-500" />
        </div>
        <div>
          <div
            data-testid="user-name"
            className="mb-0 text-lg font-semibold leading-tight"
          >
            {user.shortName}
          </div>
          <div className="text-slate-500">
            {user.isGuest ? t("guest") : t("user")}
          </div>
        </div>
        <div className="flex grow justify-end">
          <Link className="btn-default" href="/logout">
            {t("logout")}
          </Link>
        </div>
      </div>
      <div className="rounded-md border bg-white shadow-sm">
        <UserDetails userId={user.id} name={user.name} email={user.email} />
      </div>
      {createdPolls ? (
        <div className="rounded-md border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-3 py-2 shadow-sm">
            <div className="font-semibold text-slate-800 ">
              {t("yourPolls")}
            </div>
            <Link href="/new" className="btn-default">
              <Pencil className="mr-1 h-5" />
              {t("newPoll")}
            </Link>
          </div>
          {createdPolls.length > 0 ? (
            <div className="w-full sm:table sm:border-collapse">
              <div className="divide-y sm:table-row-group">
                {createdPolls.map((poll, i) => (
                  <div className="p-4 sm:table-row sm:p-0" key={i}>
                    <div className="sm:table-cell sm:p-4">
                      <div>
                        <div className="flex">
                          <Calendar className="mr-2 mt-[1px] h-5 text-primary-500" />
                          <Link
                            href={`/admin/${poll.adminUrlId}`}
                            className="text-slate-700 hover:text-primary-500 hover:no-underline"
                          >
                            <div>{poll.title}</div>
                          </Link>
                        </div>
                        <div className="ml-7 text-sm text-slate-500">
                          {dayjs(poll.createdAt).fromNow()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={Pencil} text={t("pollsEmpty")} />
          )}
        </div>
      ) : null}
    </div>
  );
};
