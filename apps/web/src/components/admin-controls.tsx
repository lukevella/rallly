"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PauseCircleIcon, PlayCircleIcon, RotateCcw } from "lucide-react";

import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { Trans } from "@/components/trans";
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

  switch (poll.status) {
    case "finalized":
      return (
        <Button
          onClick={() => {
            reopen.mutate({ pollId: poll.id });
          }}
        >
          <Icon>
            <RotateCcw />
          </Icon>
          <Trans i18nKey="reopenPoll" />
        </Button>
      );
    case "paused":
      return (
        <Button
          onClick={() => {
            resume.mutate({ pollId: poll.id });
          }}
        >
          <Icon>
            <PlayCircleIcon />
          </Icon>
          <Trans i18nKey="resumePoll" />
        </Button>
      );
    case "live":
      return (
        <Button
          onClick={() => {
            pause.mutate({ pollId: poll.id });
          }}
        >
          <Icon>
            <PauseCircleIcon />
          </Icon>
          <Trans i18nKey="pausePoll" />
        </Button>
      );
    default:
      return null;
  }
};

export function AdminControls() {
  return (
    <div className="flex items-center gap-x-2.5">
      <NotificationsToggle />
      <StatusControl />
      <ManagePoll />
      {/* <InviteDialog /> */}
    </div>
  );
}
