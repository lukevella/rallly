"use client";

import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { SpaceRole } from "@/features/space/components/space-role";
import type { MemberRole } from "@/features/space/schema";
import { Trans } from "@/i18n/client";
import { CancelInviteButton } from "./cancel-invite-button";

export function PendingInvitesDialog({
  invites,
  ...dialogProps
}: {
  invites: {
    id: string;
    email: string;
    spaceId: string;
    role: MemberRole;
    invitedBy: { name: string };
  }[];
} & DialogProps) {
  return (
    <Dialog {...dialogProps}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="pendingInvites" defaults="Pending invites" />
          </DialogTitle>
        </DialogHeader>
        <StackedList>
          {invites.map((invite) => (
            <StackedListItem key={invite.id}>
              <div className="flex-1">
                <div className="font-semibold text-sm">{invite.email}</div>
                <div className="text-muted-foreground text-sm">
                  <Trans
                    i18nKey="memberInvitedBy"
                    defaults="Invited by {inviterName}"
                    values={{ inviterName: invite.invitedBy.name }}
                  />
                </div>
              </div>
              <div className="text-sm">
                <SpaceRole role={invite.role} />
              </div>
              <CancelInviteButton invite={invite} />
            </StackedListItem>
          ))}
        </StackedList>
      </DialogContent>
    </Dialog>
  );
}
