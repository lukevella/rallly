"use client";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  MoreHorizontal,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { changeRole, deleteUser } from "./actions";

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
  return (
    <StackedListItem>
      <div>
        <OptimizedAvatarImage src={image} name={name} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground truncate">{email}</div>
      </div>
      <div className="flex items-center gap-4">
        <Badge className="capitalize">{role}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icon>
                <MoreHorizontal />
              </Icon>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {role === "user" && (
              <DropdownMenuItem
                onClick={async () => {
                  await changeRole({ userId, role: "admin" });
                  router.refresh();
                }}
              >
                <CircleArrowUpIcon className="size-4" />
                <Trans i18nKey="promoteToAdmin" defaults="Promote to Admin" />
              </DropdownMenuItem>
            )}
            {role === "admin" && (
              <DropdownMenuItem
                onClick={async () => {
                  await changeRole({ userId, role: "user" });
                  router.refresh();
                }}
              >
                <CircleArrowDownIcon className="size-4" />
                <Trans i18nKey="demoteToUser" defaults="Demote to User" />
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await deleteUser({ userId, email });
                router.refresh();
              }}
            >
              <TrashIcon className="size-4" />
              <Trans i18nKey="delete" defaults="Delete" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </StackedListItem>
  );
}
