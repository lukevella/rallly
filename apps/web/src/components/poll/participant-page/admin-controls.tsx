import { AlertCircleIcon, FileBarChart, Share2Icon } from "@rallly/icons";
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
  const { participants } = useParticipants();
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
          <CopyLinkButton />
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

export const AdminControls = () => {
  const poll = usePoll();
  const hasAdminPermission = poll?.adminUrlId;
  const { user } = useUser();

  return (
    <TopBar className="flex flex-col gap-y-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-4">
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
        {user.isGuest && poll?.userId !== user.id ? null : (
          <ManagePoll disabled={!hasAdminPermission} />
        )}
        <InviteDialog />
      </div>
    </TopBar>
  );
};
