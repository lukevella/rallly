"use client";

import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { MoreHorizontal, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteUser } from "./actions";

export function UserDropdown({
  userId,
  email,
}: { userId: string; email: string }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon>
            <MoreHorizontal />
          </Icon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
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
  );
}
