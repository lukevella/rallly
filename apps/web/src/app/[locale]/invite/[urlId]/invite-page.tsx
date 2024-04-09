"use client";
import { Button } from "@rallly/ui/button";
import { CircleUserIcon, Wand2Icon } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

import { PollLayout } from "@/components/layouts/poll-layout";
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

  if (poll.userId !== user.id) {
    return null;
  }

  return (
    <div className="flex items-center gap-x-2.5 rounded-lg border border-indigo-600/20 bg-indigo-50 px-4 py-1.5 text-indigo-600">
      <CircleUserIcon className="text-primary size-4" />
      <div className="grow text-sm">
        <Trans
          i18nKey="manageAccess"
          defaults="You are the creator of this poll"
        />
      </div>
      <div>
        <Button variant="link" asChild>
          <Link href={`/poll/${poll.id}`}>
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
          <PollLayout>
            <div className="space-y-4">
              <GoToApp />
              <Poll />
            </div>
          </PollLayout>
        </VisibilityProvider>
      </LegacyPollContextProvider>
    </Prefetch>
  );
}
