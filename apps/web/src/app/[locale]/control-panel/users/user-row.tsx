"use client";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  BanIcon,
  MoreHorizontal,
  TrashIcon,
  UserCheckIcon,
  UserPenIcon,
} from "lucide-react";
import { useTransition } from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedListItem } from "@/components/stacked-list";
import { changeRoleAction, unbanUserAction } from "@/features/user/actions";
import { userRoleSchema } from "@/features/user/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { BanUserDialog } from "./dialogs/ban-user-dialog";
import { DeleteUserDialog } from "./dialogs/delete-user-dialog";

export function UserRow({
  name,
  email,
  userId,
  image,
  role,
  banned,
  canChangeRole,
  canBan,
  canDelete,
}: {
  name: string;
  email: string;
  userId: string;
  image?: string;
  role: "admin" | "user";
  banned: boolean;
  canChangeRole: boolean;
  canBan: boolean;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  const changeRole = useSafeAction(changeRoleAction);
  const unbanUser = useSafeAction(unbanUserAction);

  const [isPending, startTransition] = useTransition();
  const deleteDialog = useDialog();
  const banDialog = useDialog();

  return (
    <>
      <StackedListItem
        className={cn({
          "opacity-50": isPending,
        })}
      >
        <div>
          <OptimizedAvatarImage src={image} name={name} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{name}</div>
          <div className="truncate text-muted-foreground">{email}</div>
        </div>
        <div className="flex items-center gap-4">
          {banned ? (
            <Badge variant="destructive">
              <Trans i18nKey="banned" defaults="Banned" />
            </Badge>
          ) : null}
          <span className="capitalize">{role}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t("moreOptions", {
                    defaultValue: "More options",
                  })}
                  variant="ghost"
                  size="icon"
                />
              }
            >
              <Icon>
                <MoreHorizontal />
              </Icon>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!canChangeRole}>
                  <Icon>
                    <UserPenIcon />
                  </Icon>
                  <Trans i18nKey="changeRole" defaults="Change role" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={role}
                    onValueChange={async (value) => {
                      startTransition(async () => {
                        await changeRole.executeAsync({
                          role: userRoleSchema.parse(value),
                          userId,
                        });
                      });
                    }}
                  >
                    <DropdownMenuRadioItem value="admin">
                      <Trans i18nKey="admin" defaults="Admin" />
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="user">
                      <Trans i18nKey="user" defaults="User" />
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              {banned ? (
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      await unbanUser.executeAsync({ userId });
                    });
                  }}
                  disabled={!canBan}
                >
                  <Icon>
                    <UserCheckIcon />
                  </Icon>
                  <Trans i18nKey="unbanUser" defaults="Unban user" />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    banDialog.trigger();
                  }}
                  disabled={!canBan}
                >
                  <BanIcon />
                  <Trans i18nKey="banUser" defaults="Ban user" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  deleteDialog.trigger();
                }}
                disabled={!canDelete}
              >
                <TrashIcon />
                <Trans i18nKey="delete" defaults="Delete" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </StackedListItem>
      <BanUserDialog {...banDialog.dialogProps} userId={userId} email={email} />
      <DeleteUserDialog
        {...deleteDialog.dialogProps}
        userId={userId}
        email={email}
      />
    </>
  );
}
