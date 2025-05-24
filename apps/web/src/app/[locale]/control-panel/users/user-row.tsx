"use client";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { userRoleSchema } from "@/features/user/schema";
import { cn } from "@rallly/ui";
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
import { MoreHorizontal, TrashIcon, UserPenIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { changeRole } from "./actions";
import { DeleteUserDialog } from "./dialogs/delete-user-dialog";

export function UserRow({
  name,
  email,
  userId,
  image,
  role,
}: {
  name: string;
  email: string;
  userId: string;
  image?: string;
  role: "admin" | "user";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const deleteDialog = useDialog();

  const isYou = userId === user?.id;
  return (
    <>
      <StackedListItem
        className={cn({
          "opacity-50": isPending,
        })}
      >
        <div>
          <OptimizedAvatarImage src={image} name={name} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{name}</div>
          <div className="text-muted-foreground truncate">{email}</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="capitalize">{role}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon>
                  <MoreHorizontal />
                </Icon>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={isYou}>
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
                        await changeRole({
                          role: userRoleSchema.parse(value),
                          userId,
                        });
                        router.refresh();
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
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  deleteDialog.trigger();
                }}
                disabled={isYou}
              >
                <TrashIcon className="size-4" />
                <Trans i18nKey="delete" defaults="Delete" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </StackedListItem>
      <DeleteUserDialog
        {...deleteDialog.dialogProps}
        userId={userId}
        email={email}
      />
    </>
  );
}
