"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { MoreHorizontalIcon, ShieldIcon, UserIcon, XIcon } from "lucide-react";
import {
  changeMemberRoleAction,
  removeMemberAction,
} from "@/features/space/member/actions";
import type { MemberDTO } from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import type { RemovalRecipient } from "./remove-member-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export function MemberDropdownMenu({
  member,
  canUpdate,
  canDelete,
  openPollCount,
  liveEventCount,
  recipients,
}: {
  member: MemberDTO;
  canUpdate: boolean;
  canDelete: boolean;
  openPollCount: number;
  liveEventCount: number;
  recipients: RemovalRecipient[];
}) {
  const removeMemberDialog = useDialog();
  const { t } = useTranslation();
  const removeMember = useMutation(
    mutationOptions(removeMemberAction, {
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
    }),
  );
  const changeMemberRole = useMutation(
    mutationOptions(changeMemberRoleAction, {
      onSuccess: () => {
        toast.success(
          t("roleChangedSuccess", {
            defaultValue: "Role changed successfully",
          }),
        );
      },
    }),
  );

  const handleRoleChange = (newRole: MemberRole) => {
    changeMemberRole.mutate({
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
              className="size-8"
            />
          }
        >
          <MoreHorizontalIcon />
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
      <RemoveMemberDialog
        {...removeMemberDialog.dialogProps}
        memberName={member.name}
        openPollCount={openPollCount}
        liveEventCount={liveEventCount}
        recipients={recipients}
        pending={removeMember.isPending}
        onConfirm={(toMemberId) => {
          removeMember.mutate({
            memberId: member.id,
            content: { action: "transfer", toMemberId },
          });
        }}
      />
    </>
  );
}
