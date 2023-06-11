import { trpc } from "@rallly/backend";
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  ChevronDownIcon,
  FileBarChart,
  LifeBuoyIcon,
  LockIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RadioTowerIcon,
  RotateCcw,
  Share2Icon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import Link from "next/link";
import React from "react";

import { Container } from "@/components/container";
import { CopyLinkButton } from "@/components/copy-link-button";
import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { useParticipants } from "@/components/participants-provider";
import ManagePoll from "@/components/poll/manage-poll";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import { Trans } from "@/components/trans";
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
            {state === "live" ? (
              <RadioTowerIcon className="text-primary h-4 w-4 animate-pulse" />
            ) : state === "paused" ? (
              <PauseCircleIcon className="h-4 w-4" />
            ) : (
              <CalendarCheckIcon className="h-4 w-4" />
            )}
            <StatusLabel status={state} />
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
                <DropdownMenuItemIconLabel icon={CalendarCheckIcon}>
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

const InviteDialog = () => {
  const { participants } = useParticipants();
  const poll = usePoll();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        <Button variant="primary" icon={Share2Icon}>
          <span className="hidden sm:block">
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-pattern from-gray-100 via-white to-white sm:max-w-md">
        <div className="flex">
          <Share2Icon className="text-primary h-7" />
        </div>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteParticipantsDescription"
              defaults="Copy and share the invite link to start gathering responses from your participants."
            />
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="mb-2">
            <Trans i18nKey="inviteLink" defaults="Invite Link" />
          </label>
          <div className="flex gap-2">
            <CopyLinkButton />
            <div className="shrink-0">
              <Button size="lg" asChild>
                <Link target="_blank" href={`/invite/${poll.id}`}>
                  <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="inviteParticipantLinkInfo"
            defaults="Anyone with this link will be able to vote on your poll."
          />
        </p>
      </DialogContent>
    </Dialog>
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
          <NotificationsToggle />
          <ManagePoll />
          <StatusControl />
          <InviteDialog />
        </div>
      </div>
    </TopBar>
  );
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  if (!poll.adminUrlId) {
    return (
      <Container className="flex h-[calc(75vh)] items-center justify-center">
        <div className="text-center">
          <p className="text-primary text-base font-semibold">
            <LockIcon className="inline-block h-14 w-14" />
          </p>
          <h1 className="mt-4 text-3xl">
            <Trans i18nKey="permissionDenied" defaults="Unauthorized" />
          </h1>
          <p className="mt-2 text-base leading-7 text-gray-600">
            <Trans
              i18nKey="permissionDeniedDescription"
              defaults="You don't have permission to access this poll."
            />
          </p>
          <div className="mt-6 flex items-center justify-center gap-x-4">
            <Button asChild variant="primary" size="lg">
              <Link href="/polls">
                <Trans i18nKey="goToHome" defaults="Go to polls" />
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="https://support.rallly.co">
                <LifeBuoyIcon className="-ml-0.5 h-5 w-5" />
                <Trans i18nKey="support" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="flex min-w-0 grow flex-col">
      <AdminControls />
      <div>
        <Container className="py-3 sm:py-8">{children}</Container>
      </div>
    </div>
  );
};

export const getPollLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <LegacyPollContextProvider>
          <PollLayout>{page}</PollLayout>
        </LegacyPollContextProvider>
      </StandardLayout>
    );
  };
