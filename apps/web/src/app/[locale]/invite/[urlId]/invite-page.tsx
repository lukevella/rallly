"use client";
import { Button } from "@rallly/ui/button";
import { ArrowUpLeftIcon } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

import { Poll } from "@/components/poll";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { VisibilityProvider } from "@/components/visibility";
import { PermissionsContext } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

import Loader from "./loading";

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") as string;
  const params = useParams<{ urlId: string }>();
  const urlId = params?.urlId as string;
  const { data: permission } = trpc.auth.getUserPermission.useQuery(
    { token },
    {
      enabled: !!token,
    },
  );

  const { data: poll, error } = trpc.polls.get.useQuery(
    { urlId },
    {
      retry: false,
    },
  );

  const { data: participants } = trpc.polls.participants.list.useQuery({
    pollId: urlId,
  });

  if (error?.data?.code === "NOT_FOUND") {
    return <div>Not found</div>;
  }
  if (!poll || !participants) {
    return <Loader />;
  }

  return (
    <PermissionsContext.Provider value={{ userId: permission?.userId ?? null }}>
      <Head>
        <title>{poll.title}</title>
      </Head>
      {children}
    </PermissionsContext.Provider>
  );
};

const GoToApp = () => {
  const poll = usePoll();
  const { user } = useUser();

  return (
    <div className="flex justify-between gap-x-4">
      <div>
        <Button
          variant="ghost"
          asChild
          className={poll.userId !== user.id ? "hidden" : ""}
        >
          <Link href={`/poll/${poll.id}`}>
            <ArrowUpLeftIcon className="text-muted-foreground size-4" />
            <Trans i18nKey="manage" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export function InvitePage() {
  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <VisibilityProvider>
          <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-4 lg:p-4">
            <GoToApp />
            <Poll />
          </div>
        </VisibilityProvider>
      </LegacyPollContextProvider>
    </Prefetch>
  );
}
