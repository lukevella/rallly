"use client";

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
import { ChevronsUpDownIcon, CirclePlusIcon } from "lucide-react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Trans } from "@/components/trans";
import { setActiveSpaceAction } from "@/features/space/actions";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { useSafeAction } from "@/lib/safe-action/client";
import { CreateSpaceDialog } from "./create-space-dialog";
import { SpaceIcon } from "./space-icon";

export function SpaceDropdown({
  spaces,
  activeSpaceId,
}: {
  spaces: {
    id: string;
    name: string;
    tier: "hobby" | "pro";
    image?: string;
  }[];
  activeSpaceId: string;
}) {
  const setActiveSpace = useSafeAction(setActiveSpaceAction);
  const newSpaceDialog = useDialog();
  const activeSpace = spaces.find((space) => space.id === activeSpaceId);

  if (!activeSpace) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button className="flex h-auto w-full p-2" variant="ghost">
            <SpaceIcon src={activeSpace.image} name={activeSpace.name} />
            <div className="min-w-0 flex-1 px-0.5 text-left">
              <div className="truncate font-medium text-sm">
                {activeSpace.name}
              </div>
              <div className="text-muted-foreground text-xs">
                <SpaceTierLabel tier={activeSpace.tier} />
              </div>
            </div>
            <Icon>
              <ChevronsUpDownIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
          align="start"
        >
          <DropdownMenuLabel>
            <Trans i18nKey="spaces" defaults="Spaces" />
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={activeSpaceId}
            onValueChange={(value) => {
              if (value === activeSpaceId) return;
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={newSpaceDialog.trigger}>
            <Icon>
              <CirclePlusIcon />
            </Icon>
            <Trans i18nKey="createSpace" defaults="Create Space" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {setActiveSpace.isExecuting ? <RouterLoadingIndicator /> : null}
      <CreateSpaceDialog {...newSpaceDialog.dialogProps} />
    </>
  );
}
