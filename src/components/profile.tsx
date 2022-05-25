import { formatRelative } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import * as React from "react";

import Calendar from "@/components/icons/calendar.svg";
import Pencil from "@/components/icons/pencil.svg";
import User from "@/components/icons/user.svg";

import { trpc } from "../utils/trpc";
import { EmptyState } from "./empty-state";
import { UserDetails } from "./profile/user-details";
import { useSession } from "./session";

export const Profile: React.VoidFunctionComponent = () => {
  const { user } = useSession();

  const { t } = useTranslation("app");
  const { data: userPolls } = trpc.useQuery(["user.getPolls"]);

  const router = useRouter();
  const createdPolls = userPolls?.polls;

  React.useEffect(() => {
    if (!user) {
      router.replace("/new");
    }
  }, [user, router]);

  if (!user || user.isGuest) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl py-4 lg:mx-0">
      <div className="mb-4 flex items-center px-4">
        <div className="mr-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-50">
          <User className="h-7 text-indigo-500" />
        </div>
        <div>
          <div
            data-testid="user-name"
            className="mb-0 text-xl font-medium leading-tight"
          >
            {user.shortName}
          </div>
          <div className="text-slate-500">
            {user.isGuest ? "Guest" : "User"}
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
                          <Calendar className="mr-2 mt-[1px] h-5 text-indigo-500" />
                          <Link href={`/p/${poll.links[0].urlId}`}>
                            <a className="text-slate-700 hover:text-indigo-500 hover:no-underline">
                              <div>{poll.title}</div>
                            </a>
                          </Link>
                        </div>
                        <div className="ml-7 text-sm text-slate-500">
                          {formatRelative(poll.createdAt, new Date())}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={Pencil} text="No polls created" />
          )}
        </div>
      ) : null}
    </div>
  );
};
