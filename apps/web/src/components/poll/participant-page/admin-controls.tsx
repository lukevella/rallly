import { trpc } from "@rallly/backend";
import {
  AlertCircleIcon,
  ArrowLeftRightIcon,
  FileBarChart,
  LogInIcon,
  Share2Icon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import React from "react";

import { useLoginModal } from "@/components/auth/login-modal";
import { LegacyButton } from "@/components/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { useParticipants } from "@/components/participants-provider";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import LegacyTooltip from "@/components/tooltip";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const InviteDialog = () => {
  const poll = usePoll();
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  const inviteLink = `${window.location.origin}/invite/${poll?.id}`;
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
      <DialogContent className="bg-gradient-to-b from-gray-200 via-white to-white sm:max-w-md">
        <div className="flex">
          <Share2Icon className="text-primary h-7" />
        </div>
        <DialogHeader className="mb-4">
          <DialogTitle className="mb-2">
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteParticipantsDescription"
              defaults="Copy and share the invite link below to start gathering responses from your participants."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden">
          <label className="mb-2">
            <Trans i18nKey="inviteLink" defaults="Invite Link" />
          </label>
          <div className="flex items-center justify-between rounded-md border bg-gray-50 p-1.5">
            <div className="truncate px-1">{inviteLink}</div>
            <div className="shrink-0">
              <CopyLinkButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminControls = () => {
  const poll = usePoll();
  const hasAdminPermission = poll?.adminUrlId;
  const { user } = useUser();
  const queryClient = trpc.useContext();
  const { openLoginModal } = useLoginModal();
  const transfer = trpc.polls.transfer.useMutation({
    onSuccess: () => {
      queryClient.polls.get.invalidate();
    },
  });

  return (
    <TopBar className="flex items-center justify-between gap-x-4">
      <TopBarTitle title={poll?.title} icon={FileBarChart} />
      <div className="flex items-center gap-x-2.5">
        {user.id !== poll?.userId ? (
          <LegacyTooltip
            className="p-2 text-slate-500"
            content={
              <Trans
                i18nKey="differentOwnerTooltip"
                defaults="This poll was created by a different user"
              />
            }
          >
            <AlertCircleIcon className="h-5" />
          </LegacyTooltip>
        ) : null}

        <NotificationsToggle />
        {user.isGuest && poll?.userId !== user.id ? (
          <LegacyButton icon={<LogInIcon />} onClick={openLoginModal}>
            <Trans i18nKey="login" />
          </LegacyButton>
        ) : (
          <ManagePoll disabled={!hasAdminPermission} />
        )}
        {hasAdminPermission && user.id !== poll.userId && !poll.demo ? (
          <LegacyTooltip
            content={
              <Trans
                i18nKey="transferTooltip"
                defaults="Transfer this poll to yourself"
              />
            }
          >
            <LegacyButton
              loading={transfer.isLoading}
              icon={<ArrowLeftRightIcon />}
              onClick={() => {
                transfer.mutate({
                  pollId: poll.id,
                });
              }}
            >
              <Trans defaults="Transfer" i18nKey="addToMyPolls" />
            </LegacyButton>
          </LegacyTooltip>
        ) : null}
        <InviteDialog />
      </div>
    </TopBar>
  );
};
