import { ArrowUpRightIcon, Share2Icon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { useParticipants } from "@/components/participants-provider";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export const InviteDialog = () => {
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  const poll = usePoll();

  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        <Button variant="primary" icon={Share2Icon}>
          <span className="hidden sm:block">
            <Trans i18nKey="share" defaults="Share" />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        data-testid="invite-participant-dialog"
        className="bg-gradient-to-b from-gray-100 via-white to-white sm:max-w-md"
      >
        <div className="flex">
          <Share2Icon className="text-primary h-6 w-6" />
        </div>
        <DialogHeader className="">
          <DialogTitle>
            <Trans i18nKey="share" defaults="Share" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteParticipantsDescription"
              defaults="Copy and share the invite link to start gathering responses from your participants."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0">
          <label className="mb-2">
            <Trans i18nKey="inviteLink" defaults="Invite Link" />
          </label>
          <div className="flex gap-2">
            <Button
              className="w-full min-w-0 bg-gray-50 px-2.5"
              onClick={() => {
                copyToClipboard(poll.inviteLink);
                setDidCopy(true);
                setTimeout(() => {
                  setDidCopy(false);
                }, 1000);
              }}
            >
              {didCopy ? (
                <Trans i18nKey="copied" />
              ) : (
                <span className="flex truncate">{poll.inviteLink}</span>
              )}
            </Button>
            <div className="shrink-0">
              <Button asChild>
                <Link target="_blank" href={`/invite/${poll.id}`}>
                  <ArrowUpRightIcon className="h-4 w-4" />
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
