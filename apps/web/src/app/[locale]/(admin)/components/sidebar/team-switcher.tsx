"use client";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const TeamSwitcher = ({
  currentTeamId,
  teams,
}: {
  currentTeamId: string;
  teams: { id: string; name: string; image?: string }[];
}) => {
  const currentTeam = teams.find((team) => team.id === currentTeamId);
  const router = useRouter();

  if (!currentTeam) {
    console.error("Current team not found");
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-gray-200 data-[state=open]:bg-gray-200">
        <OptimizedAvatarImage
          src={currentTeam.image ?? undefined}
          name={currentTeam.name}
          size="xs"
        />
        <span className="flex-1 text-left">{currentTeam.name}</span>
        <Icon>
          <ChevronsUpDownIcon />
        </Icon>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        align="start"
      >
        <DropdownMenuLabel>
          <Trans i18nKey="teams" defaults="Teams" />
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked onSelect={() => {}}>
          <OptimizedAvatarImage
            src={currentTeam?.image ?? undefined}
            name={currentTeam?.name ?? ""}
            size="xs"
          />
          <span>{currentTeam?.name ?? ""}</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Icon>
            <PlusIcon />
          </Icon>
          <span>
            <Trans i18nKey="newTeam" defaults="New Team" />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
