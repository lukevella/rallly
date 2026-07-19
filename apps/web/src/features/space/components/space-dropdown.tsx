"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ChevronsUpDownIcon,
  PlusIcon,
  SettingsIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { setActiveSpaceAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";
import { CreateSpaceDialog } from "./create-space-dialog";
import { SpaceIcon } from "./space-icon";

export function SpaceDropdown() {
  const { data: spaces = [] } = trpc.spaces.list.useQuery();
  const { data: activeSpace } = useSpace();

  const setActiveSpace = useSafeAction(setActiveSpaceAction);
  const newSpaceDialog = useDialog();

  const selectedSpaceId = activeSpace.id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={cn("flex h-auto w-full gap-2.5 p-2", {
                "pointer-events-none animate-pulse": setActiveSpace.isExecuting,
              })}
              variant="ghost"
            />
          }
        >
          <SpaceIcon
            src={activeSpace.image}
            name={activeSpace.name}
            size="lg"
          />
          <div className="min-w-0 flex-1 px-0.5 text-left">
            <div className="truncate font-medium text-sm">
              {activeSpace.name}
            </div>
            <div className="text-xs">
              <SpaceTierLabel tier={activeSpace.tier} />
            </div>
          </div>
          <Icon>
            <ChevronsUpDownIcon />
          </Icon>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-[var(--anchor-width)]"
          align="start"
        >
          <DropdownMenuLabel>
            <Trans i18nKey="spaces" defaults="Spaces" />
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedSpaceId}
            onValueChange={(value) => {
              if (value === selectedSpaceId) return;
              setActiveSpace.execute({ spaceId: value });
            }}
          >
            {spaces.map((space) => (
              <DropdownMenuRadioItem
                key={space.id}
                value={space.id}
                className="flex items-center gap-2"
              >
                <SpaceIcon size="sm" src={space.image} name={space.name} />
                <span>{space.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuItem onClick={newSpaceDialog.trigger}>
            <Icon>
              <PlusIcon />
            </Icon>
            <Trans i18nKey="createSpace" defaults="Create Space" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/settings/general" />}>
            <Icon>
              <SettingsIcon />
            </Icon>
            <Trans i18nKey="spaceSettings" defaults="Space Settings" />
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings/members" />}>
            <Icon>
              <UserPlusIcon />
            </Icon>
            <Trans i18nKey="spaceInviteMember" defaults="Invite Member" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateSpaceDialog {...newSpaceDialog.dialogProps} />
    </>
  );
}
