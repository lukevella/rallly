"use client";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowLeftIcon,
  ArrowUpRight,
  ChevronDownIcon,
  ListIcon,
  LogInIcon,
  LogOutIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RotateCcw,
  ShieldCloseIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

import Loader from "@/app/[locale]/poll/[urlId]/skeleton";
import { LogoutButton } from "@/app/components/logout-button";
import { InviteDialog } from "@/components/invite-dialog";
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
import { PollStatusLabel } from "@/components/poll-status";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

const StatusControl = () => {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const reopen = trpc.polls.reopen.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          event: null,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });
  const pause = trpc.polls.pause.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: true,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const resume = trpc.polls.resume.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: false,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button>
            <PollStatusLabel status={poll.status} />
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {poll.event ? (
            <DropdownMenuItem
              onClick={() => {
                reopen.mutate({ pollId: poll.id });
              }}
            >
              <DropdownMenuItemIconLabel icon={RotateCcw}>
                <Trans i18nKey="reopenPoll" defaults="Reopen Poll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          ) : (
            <>
              {poll.closed ? (
                <DropdownMenuItem
                  onClick={() => resume.mutate({ pollId: poll.id })}
                >
                  <DropdownMenuItemIconLabel icon={PlayCircleIcon}>
                    <Trans i18nKey="resumePoll" defaults="Resume" />
                  </DropdownMenuItemIconLabel>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => pause.mutate({ pollId: poll.id })}
                >
                  <DropdownMenuItemIconLabel icon={PauseCircleIcon}>
                    <Trans i18nKey="pausePoll" defaults="Pause" />
                  </DropdownMenuItemIconLabel>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const AdminControls = () => {
  return (
    <div className="flex items-center gap-x-2">
      <NotificationsToggle />
      <StatusControl />
      <ManagePoll />
      <InviteDialog />
    </div>
  );
};

const Layout = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const pollLink = `/poll/${poll.id}`;
  const pathname = usePathname();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b p-3 lg:px-5">
        <div className="flex items-center gap-x-4">
          {pathname === pollLink ? (
            <Button variant="ghost" asChild>
              <Link href="/polls">
                <Icon>
                  <ListIcon />
                </Icon>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href={pollLink}>
                <Icon>
                  <ArrowLeftIcon />
                </Icon>
              </Link>
            </Button>
          )}
          <h1 className="text-sm font-medium">{poll.title}</h1>
        </div>
        <div>
          <AdminControls />
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-4 lg:p-4">
        {children}
      </div>
    </div>
  );
};

const PermissionGuard = ({ children }: React.PropsWithChildren) => {
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

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  const poll = trpc.polls.get.useQuery({ urlId });
  const participants = trpc.polls.participants.list.useQuery({ pollId: urlId });
  const watchers = trpc.polls.getWatchers.useQuery({ pollId: urlId });

  if (!poll.data || !watchers.data || !participants.data) {
    return <Loader />;
  }

  return <>{children}</>;
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
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
          <Layout>{children}</Layout>
        </PermissionGuard>
      </LegacyPollContextProvider>
    </Prefetch>
  );
};
