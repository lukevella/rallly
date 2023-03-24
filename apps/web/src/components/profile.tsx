import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import * as React from "react";

import Badge from "@/components/badge";
import Calendar from "@/components/icons/calendar.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import Pencil from "@/components/icons/pencil.svg";
import User from "@/components/icons/user.svg";
import Tooltip from "@/components/tooltip";

import { useDayjs } from "../utils/dayjs";
import { trpc } from "../utils/trpc";
import { EmptyState } from "./empty-state";
import { UserDetails } from "./profile/user-details";
import { useUser } from "./user-provider";

export const Profile: React.FunctionComponent = () => {
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
    <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
      <Head>
        <title>
          {t("profileUser", {
            username: user.name,
          })}
        </title>
      </Head>
      <div className="flex gap-4 rounded-md border bg-white p-3 shadow-sm">
        <div className="border-primary-200/50 bg-primary-50 inline-flex h-12 w-12 items-center justify-center rounded border">
          <User className="text-primary-500 h-7" />
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
            <div className="w-full sm:border-collapse">
              <div className="divide-y">
                {createdPolls.map((poll, i) => (
                  <div key={i}>
                    <Link
                      href={`/admin/${poll.adminUrlId}`}
                      className="block h-full p-3 hover:bg-gray-50 active:bg-gray-100 sm:p-4"
                    >
                      <span className="flex gap-4">
                        <span>
                          <Calendar className="text-primary-500 w-10" />
                        </span>
                        <span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 hover:no-underline">
                              {poll.title}
                            </span>
                            {poll.closed ? (
                              <Tooltip content={t("pollHasBeenLocked")}>
                                <Badge color="red">
                                  <LockClosed className="h-4" />
                                </Badge>
                              </Tooltip>
                            ) : null}
                          </span>
                          <span className="text-sm text-slate-500">
                            {dayjs(poll.createdAt).fromNow()}
                          </span>
                        </span>
                      </span>
                    </Link>
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
