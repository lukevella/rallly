"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
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
import { useMutation } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  PlusIcon,
  SettingsIcon,
  UserPlusIcon,
} from "lucide-react";
import React from "react";
import { Link } from "@/components/link";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { setActiveSpaceAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import type { SpaceTier } from "@/features/space/schema";
import { Trans } from "@/i18n/client";
import { CreateSpaceDialog } from "./create-space-dialog";
import { SpaceIcon } from "./space-icon";

export function SpaceDropdown({
  spaces,
}: {
  spaces: {
    id: string;
    name: string;
    image?: string;
    tier: SpaceTier;
  }[];
}) {
  const { data: activeSpace } = useSpace();
  const [pendingSpaceId, setPendingSpaceId] = React.useState<string>();

  const setActiveSpace = useMutation(
    mutationOptions(setActiveSpaceAction, {
      onError: () => setPendingSpaceId(undefined),
    }),
  );
  const newSpaceDialog = useDialog();

  const pendingSpace = spaces.find((space) => space.id === pendingSpaceId);
  const isSwitching = !!pendingSpace && pendingSpace.id !== activeSpace.id;
  const displayedSpace = isSwitching ? pendingSpace : activeSpace;
  const selectedSpaceId = displayedSpace.id;
  const nameId = React.useId();

  return (
    <>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-labelledby={nameId}
                className={cn(
                  // The icon may be any shape (a transparent PNG logo), so
                  // nothing paints behind it: the ghost hover background
                  // would show through the transparent corners.
                  "group/space-trigger relative size-12 rounded-lg bg-transparent p-0 hover:bg-transparent active:bg-transparent data-popup-open:bg-transparent",
                  {
                    "pointer-events-none": isSwitching,
                  },
                )}
                variant="ghost"
                size="icon-lg"
              />
            }
          >
            {/* Dimming with a filter keeps transparent pixels transparent,
              so the effect follows the icon's own shape. */}
            <SpaceIcon
              src={displayedSpace.image}
              name={displayedSpace.name}
              size="xl"
              className="transition-[filter] duration-150 ease-out group-hover/space-trigger:brightness-50 group-focus-visible/space-trigger:brightness-50 group-data-popup-open/space-trigger:brightness-50 motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex scale-75 items-center justify-center text-white opacity-0 transition-[opacity,scale] duration-150 ease-out group-hover/space-trigger:scale-100 group-hover/space-trigger:opacity-100 group-focus-visible/space-trigger:scale-100 group-focus-visible/space-trigger:opacity-100 group-data-popup-open/space-trigger:scale-100 group-data-popup-open/space-trigger:opacity-100 motion-reduce:transition-none"
            >
              <ChevronDownIcon className="size-5 drop-shadow-sm" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel>
              <Trans i18nKey="spaces" defaults="Spaces" />
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedSpaceId}
              onValueChange={(value) => {
                if (value === selectedSpaceId) return;
                setPendingSpaceId(value);
                setActiveSpace.mutate({ spaceId: value });
              }}
            >
              {spaces.map((space) => (
                <DropdownMenuRadioItem
                  key={space.id}
                  value={space.id}
                  className="flex items-center gap-2"
                >
                  <SpaceIcon size="sm" src={space.image} name={space.name} />
                  <span className="min-w-0 truncate" title={space.name}>
                    {space.name}
                  </span>
                  {/* Translucent so the badge stays a step lighter than
                    the row, highlighted or not. */}
                  <Badge
                    variant={space.tier === "pro" ? "secondary" : "default"}
                    size="sm"
                    className={cn("ml-auto", {
                      "bg-foreground/10 dark:bg-foreground/10":
                        space.tier !== "pro",
                    })}
                  >
                    <SpaceTierLabel tier={space.tier} />
                  </Badge>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuItem onClick={newSpaceDialog.trigger}>
              <PlusIcon />
              <Trans i18nKey="createSpace" defaults="Create space" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings/general" />}>
              <SettingsIcon />
              <Trans i18nKey="spaceSettings" defaults="Space settings" />
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/members" />}>
              <UserPlusIcon />
              <Trans i18nKey="spaceInviteMember" defaults="Invite member" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p
          id={nameId}
          className="max-w-full truncate text-muted-foreground text-sm"
        >
          {displayedSpace.name}
        </p>
      </div>
      <CreateSpaceDialog {...newSpaceDialog.dialogProps} />
      {isSwitching ? <RouterLoadingIndicator /> : null}
    </>
  );
}
