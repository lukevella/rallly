import { formatRelative } from "date-fns";
import Link from "next/link";
import * as React from "react";

import Calendar from "@/components/icons/calendar.svg";
import Pencil from "@/components/icons/pencil.svg";
import User from "@/components/icons/user.svg";

import { trpc } from "../utils/trpc";
import Badge from "./badge";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { useSession } from "./session";

export const Profile: React.VoidFunctionComponent = () => {
  const { user } = useSession();

  const { data: userPolls } = trpc.useQuery(["user.getPolls"]);

  const createdPolls = userPolls?.polls;

  if (!user || user.isGuest) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl lg:mx-0">
      <div className="flex items-center p-4">
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
      <div className="card mb-4 p-0">
        <div className="flex items-center justify-between border-b p-4 shadow-sm">
          <div className="text-lg text-slate-700 ">User details</div>
          <Button disabled={true} type="primary">
            Save
          </Button>
        </div>
        <div className="divide-y">
          <div className="flex p-4 pr-8">
            <label htmlFor="name" className="w-1/3 text-slate-500">
              Name
            </label>
            <div className="w-2/3">
              <input
                id="name"
                className="input w-full"
                value={user.name}
                placeholder="Jessie"
              />
            </div>
          </div>
          <div className="flex p-4 pr-8">
            <label htmlFor="random-8904" className="w-1/3 text-slate-500">
              Email
            </label>
            <div className="w-2/3">
              <input
                id="random-8904"
                value={user.email}
                className="input w-full"
                placeholder="jessie.jackson@example.com"
              />
            </div>
          </div>
        </div>
      </div>
      {createdPolls ? (
        <div className="card mb-4 p-0">
          <div className="border-b p-4 text-lg text-slate-700 shadow-sm">
            Recently created
          </div>
          {createdPolls.length > 0 ? (
            <div className="w-full sm:table sm:border-collapse">
              <div className="divide-y sm:table-row-group">
                {createdPolls.map((poll, i) => (
                  <div className="p-4 sm:table-row sm:p-0" key={i}>
                    <div className="sm:table-cell sm:p-4">
                      <div>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-5 text-indigo-500" />
                          <Link href={`/p/${poll.links[0].urlId}`}>
                            <a className="text-slate-700 hover:text-indigo-500 hover:no-underline">
                              <div>{poll.title}</div>
                            </a>
                          </Link>
                        </div>
                        <div className="ml-7 text-sm text-slate-500">
                          Created: {formatRelative(poll.createdAt, new Date())}
                        </div>
                      </div>
                    </div>
                    <div className="ml-7 mt-4 sm:m-0 sm:table-cell sm:p-4">
                      <div className="flex space-x-2">
                        {poll.verified ? (
                          <Badge color="green">Verified</Badge>
                        ) : (
                          <Badge>Unverified</Badge>
                        )}
                        {poll.closed ? (
                          <Badge color="amber">Locked</Badge>
                        ) : (
                          <Badge color="blue">Open</Badge>
                        )}
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
