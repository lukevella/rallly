"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowLeftIcon,
  ArrowUpRight,
  ArrowUpRightIcon,
  BarChart2Icon,
  CalendarCheck2Icon,
  CalendarIcon,
  CrownIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldCloseIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import { LogoutButton } from "@/app/components/logout-button";
import { PageHeader, PageTitle } from "@/app/components/page-layout";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/app/components/responsive-menu";
import { LoginLink } from "@/components/login-link";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

export const PermissionGuard = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const { user } = useUser();
  if (!poll.adminUrlId) {
    return (
      <PageDialog icon={ShieldCloseIcon}>
        <PageDialogHeader>
          <PageDialogTitle>
            <Trans i18nKey="permissionDenied" defaults="Unauthorized" />
          </PageDialogTitle>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedDescription"
              defaults="If you are the poll creator, please login to administor your poll."
            />
          </PageDialogDescription>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedParticipant"
              defaults="If you are not the poll creator, you should go to the Invite Page."
              components={{
                a: <Link className="text-link" href={`/invite/${poll.id}`} />,
              }}
            />
          </PageDialogDescription>
        </PageDialogHeader>
        <PageDialogFooter>
          {user.isGuest ? (
            <Button asChild variant="primary">
              <LoginLink>
                <LogInIcon className="-ml-1 size-4" />
                <Trans i18nKey="login" defaults="Login" />
              </LoginLink>
            </Button>
          ) : (
            <LogoutButton>
              <LogOutIcon className="-ml-1 size-4" />
              <Trans i18nKey="loginDifferent" defaults="Switch user" />
            </LogoutButton>
          )}
          <Button asChild>
            <Link href={`/invite/${poll.id}`}>
              <Trans i18nKey="goToInvite" defaults="Go to Invite Page" />
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </PageDialogFooter>
      </PageDialog>
    );
  }

  return <>{children}</>;
};

function PollHeader() {
  const poll = usePoll();
  return (
    <PageHeader className="flex items-center justify-between">
      <div className="flex items-center gap-x-2.5">
        <Button variant="ghost" asChild>
          <Link href="/polls">
            <Icon>
              <ArrowLeftIcon />
            </Icon>
          </Link>
        </Button>
        <PageTitle>{poll.title}</PageTitle>
      </div>
    </PageHeader>
  );
}
const Prefetch = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  const poll = trpc.polls.get.useQuery({ urlId });
  const subscription = trpc.user.subscription.useQuery();
  const participants = trpc.polls.participants.list.useQuery({ pollId: urlId });
  const watchers = trpc.polls.getWatchers.useQuery({ pollId: urlId });

  if (
    !poll.data ||
    !watchers.data ||
    !participants.data ||
    !subscription.data
  ) {
    return null;
  }

  return <>{children}</>;
};

export const AdminLayout = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  if (!urlId) {
    // probably navigating away
    return null;
  }

  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <PermissionGuard>
          <div className="space-y-4">
            <PollHeader />
            <div>{children}</div>
          </div>
        </PermissionGuard>
      </LegacyPollContextProvider>
    </Prefetch>
  );
};
