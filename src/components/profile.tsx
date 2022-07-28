import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

import Calendar from "@/components/icons/calendar.svg";
import Pencil from "@/components/icons/pencil.svg";
import User from "@/components/icons/user.svg";

import { useDayjs } from "../utils/dayjs";
import { trpc } from "../utils/trpc";
import { EmptyState } from "./empty-state";
import LoginForm from "./login-form";
import { UserDetails } from "./profile/user-details";
import { useSession } from "./session";

export const Profile: React.VoidFunctionComponent = () => {
  const { user } = useSession();
  const { dayjs } = useDayjs();

  const { t } = useTranslation("app");
  const { data: userPolls } = trpc.useQuery(["user.getPolls"]);

  const createdPolls = userPolls?.polls;

  if (user.isGuest) {
    return (
      <div className="card my-4 p-0">
        <Head>
          <title>{t("profileLogin")}</title>
        </Head>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4 lg:mx-0">
      <Head>
        <title>
          {t("profileUser", {
            username: user.name,
          })}
        </title>
      </Head>
      <div className="mb-4 flex items-center px-4">
        <div className="mr-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50">
          <User className="h-7 text-primary-500" />
        </div>
        <div>
          <div
            data-testid="user-name"
            className="mb-0 text-xl font-medium leading-tight"
          >
            {user.shortName}
          </div>
          <div className="text-slate-500">
            {user.isGuest ? t("guest") : t("user")}
          </div>
        </div>
      </div>

      <UserDetails userId={user.id} name={user.name} email={user.email} />
      {createdPolls ? (
        <div className="card p-0">
          <div className="flex items-center justify-between border-b p-4 shadow-sm">
            <div className="text-lg text-slate-700">{t("yourPolls")}</div>
            <Link href="/new">
              <a className="btn-default">
                <Pencil className="mr-1 h-5" />
                {t("newPoll")}
              </a>
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
                          <Link href={`/admin/${poll.adminUrlId}`}>
                            <a className="text-slate-700 hover:text-primary-500 hover:no-underline">
                              <div>{poll.title}</div>
                            </a>
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
