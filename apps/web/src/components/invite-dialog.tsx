import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { ArrowUpRightIcon, Share2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { useParticipants } from "@/components/participants-provider";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export function CopyInviteLinkButton() {
  const [didCopy, setDidCopy] = React.useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();
  const poll = usePoll();
  const inviteLinkWithoutProtocol = poll.inviteLink.replace(/^https?:\/\//, "");

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  return (
    <Button
      className="min-w-0 grow"
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
        <span className="min-w-0 truncate">{inviteLinkWithoutProtocol}</span>
      )}
    </Button>
  );
}

export const InviteDialog = () => {
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  const poll = usePoll();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        <Button variant="primary">
          <Icon>
            <Share2Icon />
          </Icon>
          <Trans i18nKey="share" defaults="Share" />
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="invite-participant-dialog">
        <div className="flex">
          <Share2Icon className="text-primary size-6" />
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
            <CopyInviteLinkButton />
            <div className="shrink-0">
              <Button asChild>
                <Link target="_blank" href={`/invite/${poll.id}`}>
                  <ArrowUpRightIcon className="size-4" />
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
