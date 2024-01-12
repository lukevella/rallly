"use client";
import { Button } from "@rallly/ui/button";
import { ArrowUpLeftIcon } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

import { PageHeader } from "@/app/components/page-layout";
import { Poll } from "@/components/poll";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { useUser } from "@/components/user-provider";
import { VisibilityProvider } from "@/components/visibility";
import { PermissionsContext } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

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
    return null;
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
    <PageHeader variant="ghost">
      <div className="flex justify-between">
        <div>
          <Button
            variant="ghost"
            asChild
            className={poll.userId !== user.id ? "hidden" : ""}
          >
            <Link href={`/poll/${poll.id}`}>
              <ArrowUpLeftIcon className="h-4 w-4 text-muted-foreground" />
              <Trans i18nKey="manage" />
            </Link>
          </Button>
        </div>
        <div>
          <UserDropdown />
        </div>
      </div>
    </PageHeader>
  );
};

export default function InvitePage() {
  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <VisibilityProvider>
          <GoToApp />
          <div className="lg:px-6 lg:py-5 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="-mx-1">
                <Poll />
              </div>
            </div>
          </div>
        </VisibilityProvider>
      </LegacyPollContextProvider>
    </Prefetch>
  );
}
