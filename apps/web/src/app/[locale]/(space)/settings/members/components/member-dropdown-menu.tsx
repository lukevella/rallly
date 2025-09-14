"use client";

import { subject } from "@casl/ability";
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
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, ShieldIcon, UserIcon, XIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import {
  changeMemberRoleAction,
  removeMemberAction,
} from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import type { MemberDTO } from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function MemberDropdownMenu({ member }: { member: MemberDTO }) {
  const space = useSpace();
  const removeMemberDialog = useDialog();
  const removeMember = useSafeAction(removeMemberAction);
  const changeMemberRole = useSafeAction(changeMemberRoleAction);
  const { t } = useTranslation();

  const canUpdateMember = space
    .getMemberAbility()
    .can("update", subject("SpaceMember", member));

  const canDeleteMember = space
    .getMemberAbility()
    .can("delete", subject("SpaceMember", member));

  const handleRoleChange = (newRole: MemberRole) => {
    toast.promise(
      changeMemberRole.executeAsync({
        memberId: member.id,
        role: newRole,
      }),
      {
        loading: t("changingRole", {
          defaultValue: "Changing role...",
        }),
        success: t("roleChangedSuccess", {
          defaultValue: "Role changed successfully",
        }),
        error: t("roleChangedError", {
          defaultValue: "Failed to change role",
        }),
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Icon>
              <MoreHorizontalIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {member.role === "member" ? (
            <DropdownMenuItem
              onClick={() => handleRoleChange("admin")}
              disabled={!canUpdateMember}
            >
              <Icon>
                <ShieldIcon className="size-4" />
              </Icon>
              <Trans i18nKey="makeAdmin" defaults="Make admin" />
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleRoleChange("member")}
              disabled={!canUpdateMember}
            >
              <Icon>
                <UserIcon />
              </Icon>
              <Trans i18nKey="makeMember" defaults="Make member" />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              removeMemberDialog.trigger();
            }}
            disabled={!canDeleteMember}
            className="text-destructive"
          >
            <XIcon className="size-4" />
            <Trans i18nKey="removeMember" defaults="Remove member" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...removeMemberDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="removeMember" defaults="Remove Member" />
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
              onClick={() => {
                toast.promise(
                  removeMember.executeAsync({
                    memberId: member.id,
                  }),
                  {
                    loading: t("removeMemberLoading", {
                      defaultValue: "Removing member...",
                    }),
                    success: t("removeMemberSuccess", {
                      defaultValue: "Member removed successfully",
                    }),
                    error: t("removeMemberError", {
                      defaultValue: "Failed to remove member",
                    }),
                  },
                );
                removeMemberDialog.dismiss();
              }}
            >
              <Trans i18nKey="confirm" defaults="Confirm" />
            </Button>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
