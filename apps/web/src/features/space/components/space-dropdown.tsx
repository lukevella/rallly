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
                  "group/space-trigger relative size-12 rounded-lg p-0",
                  {
                    "pointer-events-none": isSwitching,
                  },
                )}
                variant="ghost"
                size="icon-lg"
              />
            }
          >
            <SpaceIcon
              src={displayedSpace.image}
              name={displayedSpace.name}
              size="xl"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 hidden items-center justify-center rounded-lg bg-black/50 text-white group-hover/space-trigger:flex group-focus-visible/space-trigger:flex group-data-popup-open/space-trigger:flex"
            >
              <ChevronDownIcon className="size-5" />
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
                  {space.tier === "pro" ? (
                    <Badge variant="secondary" size="sm" className="ml-auto">
                      <SpaceTierLabel tier={space.tier} />
                    </Badge>
                  ) : null}
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
