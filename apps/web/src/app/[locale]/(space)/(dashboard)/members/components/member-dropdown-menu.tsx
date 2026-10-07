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
import type {
  MemberContentSummary,
  MemberDTO,
} from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import type { RemovalRecipient } from "./remove-member-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export function MemberDropdownMenu({
  member,
  canUpdate,
  canDelete,
  contentSummary,
  recipients,
}: {
  member: MemberDTO;
  canUpdate: boolean;
  canDelete: boolean;
  contentSummary: MemberContentSummary;
  recipients: RemovalRecipient[];
}) {
  const removeMemberDialog = useDialog();
  const { t } = useTranslation();
  const removeMember = useMutation(
    mutationOptions(removeMemberAction, {
      onSuccess: (result) => {
        if (result && !result.ok) {
          toast.error(
            t("removeMemberRecipientUnavailable", {
              defaultValue:
                "The member you chose can no longer receive this content. Choose someone else.",
            }),
          );
          return;
        }
        removeMemberDialog.dismiss();
        toast.success(
          t("removeMemberSuccess", {
            defaultValue: "Member removed successfully",
          }),
        );
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
        summary={contentSummary}
        recipients={recipients}
        pending={removeMember.isPending}
        onConfirm={(content) => {
          removeMember.mutate({ memberId: member.id, content });
        }}
      />
    </>
  );
}
