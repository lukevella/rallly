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
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { removeMemberAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import type { MemberDTO } from "@/features/space/member/types";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function MemberDropdownMenu({ member }: { member: MemberDTO }) {
  const space = useSpace();
  const removeMemberDialog = useDialog();
  const removeMember = useSafeAction(removeMemberAction);
  const { t } = useTranslation();
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
          <DropdownMenuItem
            onClick={() => {
              removeMemberDialog.trigger();
            }}
            disabled={space
              .getMemberAbility()
              .cannot("delete", subject("SpaceMember", member))}
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
              <Trans i18nKey="remove" defaults="Remove Member" />
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
