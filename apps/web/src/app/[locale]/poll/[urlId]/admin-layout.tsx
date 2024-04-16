"use client";
import { Button } from "@rallly/ui/button";
import {
  ArrowUpRight,
  LogInIcon,
  LogOutIcon,
  ShieldCloseIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import { FinalizeDialog } from "@/app/[locale]/poll/[urlId]/finalize-dialog";
import { LogoutButton } from "@/app/components/logout-button";
import { InviteDialog } from "@/components/invite-dialog";
import { PollLayout } from "@/components/layouts/poll-layout";
import { LoginLink } from "@/components/login-link";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
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

function ReopenButton({ pollId }: { pollId: string }) {
  const queryClient = trpc.useUtils();
  const reopen = trpc.polls.reopen.useMutation({
    onSuccess: () => {
      queryClient.invalidate();
    },
  });
  return (
    <Button
      onClick={() => {
        reopen.mutate({ pollId });
      }}
    >
      <Trans i18nKey="reopenPoll" />
    </Button>
  );
}

function PollHeader() {
  const poll = usePoll();
  return (
    <div className="flex items-center gap-x-2.5">
      <span className="text-muted-foreground px-2.5 text-sm">Actions:</span>
      <NotificationsToggle />
      <InviteDialog />
      {poll.event ? (
        <ReopenButton pollId={poll.id} />
      ) : (
        <FinalizeDialog pollId={poll.id} />
      )}
      <ManagePoll />
    </div>
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
          <PollLayout>
            <div className="mb-4 flex justify-end">
              <PollHeader />
            </div>
            <div className="pb-16">{children}</div>
          </PollLayout>
        </PermissionGuard>
      </LegacyPollContextProvider>
    </Prefetch>
  );
};
