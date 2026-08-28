"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { MoreVerticalIcon, ShieldIcon, UserIcon, XIcon } from "lucide-react";
import {
  changeMemberRoleAction,
  removeMemberAction,
} from "@/features/space/member/actions";
import type { MemberDTO } from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function MemberDropdownMenu({
  member,
  canUpdate,
  canDelete,
}: {
  member: MemberDTO;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const removeMemberDialog = useDialog();
  const { t } = useTranslation();
  const removeMember = useSafeAction(removeMemberAction, {
    onSuccess: () => {
      toast.success(
        t("removeMemberSuccess", {
          defaultValue: "Member removed successfully",
        }),
      );
    },
    onSettled: () => {
      removeMemberDialog.dismiss();
    },
  });
  const changeMemberRole = useSafeAction(changeMemberRoleAction, {
    onSuccess: () => {
      toast.success(
        t("roleChangedSuccess", {
          defaultValue: "Role changed successfully",
        }),
      );
    },
  });

  const handleRoleChange = (newRole: MemberRole) => {
    changeMemberRole.execute({
      memberId: member.id,
      role: newRole,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("moreOptions", { defaultValue: "More options" })}
              variant="ghost"
              size="icon"
            />
          }
        >
          <MoreVerticalIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {member.role === "member" ? (
            <DropdownMenuItem
              onClick={() => handleRoleChange("admin")}
              disabled={!canUpdate}
            >
              <ShieldIcon className="size-4" />
              <Trans i18nKey="makeAdmin" defaults="Make admin" />
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleRoleChange("member")}
              disabled={!canUpdate}
            >
              <UserIcon />
              <Trans i18nKey="makeMember" defaults="Make member" />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              removeMemberDialog.trigger();
            }}
            disabled={!canDelete}
            variant="destructive"
          >
            <XIcon />
            <Trans i18nKey="removeMember" defaults="Remove member" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...removeMemberDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="removeMember" defaults="Remove member" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="removeMemberConfirmation"
                defaults="Are you sure you want to remove this member?"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={removeMember.isExecuting}
              onClick={() => {
                removeMember.execute({ memberId: member.id });
              }}
            >
              <Trans i18nKey="confirm" defaults="Confirm" />
            </Button>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
