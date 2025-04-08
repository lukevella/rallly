"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";

export const TeamSwitcher = ({
  currentTeamId,
  teams,
}: {
  currentTeamId: string;
  teams: { id: string; name: string; image?: string; pro?: boolean }[];
}) => {
  const currentTeam = teams.find((team) => team.id === currentTeamId);
  if (!currentTeam) {
    console.error("Current team not found");
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-gray-200 data-[state=open]:bg-gray-200">
        <OptimizedAvatarImage
          src={currentTeam.image}
          name={currentTeam.name}
          size="xs"
        />
        <span className="flex-1 text-left">{currentTeam.name}</span>
        {currentTeam.pro && <ProBadge />}
        <span className="-mr-1 flex size-7 items-center justify-center">
          <Icon>
            <ChevronsUpDownIcon />
          </Icon>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        align="start"
      >
        <DropdownMenuLabel>
          <Trans i18nKey="teams" defaults="Teams" />
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>
          <OptimizedAvatarImage
            src={currentTeam.image}
            name={currentTeam.name}
            size="xs"
          />
          <span className="flex-1">{currentTeam.name}</span>
          {currentTeam.pro && <ProBadge />}
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
