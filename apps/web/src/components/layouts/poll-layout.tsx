import { trpc } from "@rallly/backend";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  FileBarChart,
  LogInIcon,
  LogOutIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RotateCcw,
  ShieldCloseIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { Container } from "@/components/container";
import { InviteDialog } from "@/components/invite-dialog";
import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import ManagePoll from "@/components/poll/manage-poll";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { PollStatus } from "@/components/poll-status";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

import { NextPageWithLayout } from "../../types";

type PollState = "live" | "paused" | "closed";

const StatusLabel = ({ status }: { status: PollState }) => {
  return (
    <span>
      {(() => {
        switch (status) {
          case "live":
            return <Trans i18nKey="pollStatusOpen" defaults="Live" />;
          case "paused":
            return <Trans i18nKey="pollStatusPaused" defaults="Paused" />;
          case "closed":
            return <Trans i18nKey="pollStatusClosed" defaults="Finalized" />;
        }
      })()}
    </span>
  );
};

const StatusControl = () => {
  const poll = usePoll();
  const state = poll.selectedOptionId
    ? "closed"
    : poll.closed
    ? "paused"
    : "live";
  const queryClient = trpc.useContext();
  const reopen = trpc.polls.reopen.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });
  const pause = trpc.polls.pause.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const resume = trpc.polls.resume.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const bookDate = trpc.polls.book.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const [isFinalizing, setIsFinalizing] = React.useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button>
            <PollStatus status={state} />
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {poll.selectedOptionId ? (
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setIsFinalizing(true);
                }}
              >
                <DropdownMenuItemIconLabel icon={CheckCircleIcon}>
                  <Trans i18nKey="finishPoll" defaults="Finalize" />
                </DropdownMenuItemIconLabel>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isFinalizing} onOpenChange={setIsFinalizing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="pickADate" />
            </DialogTitle>
          </DialogHeader>
          <FinalizePollForm
            name="finalize-poll"
            onSubmit={(data) => {
              bookDate.mutate(
                {
                  pollId: poll.id,
                  optionId: data.selectedOptionId,
                },
                {
                  onSuccess: () => {
                    setIsFinalizing(false);
                  },
                },
              );
            }}
          />
          <DialogFooter>
            <Button onClick={() => setIsFinalizing(false)}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              variant="primary"
              loading={bookDate.isLoading}
              form="finalize-poll"
              type="submit"
            >
              <Trans i18nKey="finalize" defaults="Finalize" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdminControls = () => {
  const poll = usePoll();

  return (
    <TopBar>
      <div className="flex items-center justify-between gap-x-4">
        <div className="flex min-w-0 gap-2">
          <TopBarTitle title={poll?.title} icon={FileBarChart} />
        </div>
        <div className="flex items-center gap-x-2.5">
          <StatusControl />
          <NotificationsToggle />
          <ManagePoll />
          <InviteDialog />
        </div>
      </div>
    </TopBar>
  );
};

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex min-w-0 grow flex-col">
      <AdminControls />
      <div>
        <Container className="py-3 sm:py-8">{children}</Container>
      </div>
    </div>
  );
};

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
              defaults="This poll belongs to a different user."
            />
          </PageDialogDescription>
        </PageDialogHeader>
        <PageDialogFooter>
          {user.isGuest ? (
            <Button asChild variant="primary" size="lg">
              <Link href="/login">
                <LogInIcon className="-ml-1 h-5 w-5" />
                <Trans i18nKey="login" defaults="Login" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="primary" size="lg">
              <Link href="/logout">
                <LogOutIcon className="-ml-1 h-5 w-5" />
                <Trans i18nKey="loginDifferent" defaults="Switch user" />
              </Link>
            </Button>
          )}
          <Button asChild size="lg">
            <Link href="/polls">
              <Trans i18nKey="goToHome" defaults="Go to polls" />
            </Link>
          </Button>
        </PageDialogFooter>
      </PageDialog>
    );
  }

  return <>{children}</>;
};

const Title = () => {
  const poll = usePoll();
  return (
    <Head>
      <title>{poll.title}</title>
    </Head>
  );
};

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const router = useRouter();
  const [urlId] = React.useState(router.query.urlId as string);

  const poll = trpc.polls.get.useQuery({ urlId });
  const watchers = trpc.polls.getWatchers.useQuery({ pollId: urlId });

  if (!poll.isFetched || !watchers.isFetched) {
    return null;
  }

  return <>{children}</>;
};

const PollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <Title />
        <PermissionGuard>
          <Layout>{children}</Layout>
        </PermissionGuard>
      </LegacyPollContextProvider>
    </Prefetch>
  );
};

export const getPollLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <PollLayout>{page}</PollLayout>
      </StandardLayout>
    );
  };
