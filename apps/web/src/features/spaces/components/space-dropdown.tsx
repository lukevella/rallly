"use client";

import { cn } from "@rallly/ui";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { CirclePlusIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { setActiveSpaceAction } from "@/features/spaces/actions";
import { useSafeAction } from "@/lib/safe-action/client";
import { NewSpaceDialog } from "./new-space-dialog";
import { SpaceIcon } from "./space-icon";

export function SpaceDropdown({
  spaces,
  activeSpaceId,
  children,
}: {
  spaces: {
    id: string;
    name: string;
    tier: "hobby" | "pro";
  }[];
  activeSpaceId: string;
  children?: React.ReactNode;
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
        <DropdownMenuTrigger
          className={cn({
            "animate-pulse duration-500": setActiveSpace.isExecuting,
          })}
          asChild={Boolean(children)}
        >
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
          align="start"
        >
          <DropdownMenuRadioGroup
            value={activeSpaceId}
            onValueChange={(value) => {
              setActiveSpace.execute({ spaceId: value });
            }}
          >
            {spaces.map((space) => (
              <DropdownMenuRadioItem
                key={space.id}
                value={space.id}
                className="flex items-center gap-2"
              >
                <SpaceIcon size="sm" name={space.name} />
                <span>{space.name}</span>
                {space.tier === "pro" ? <ProBadge /> : null}
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
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Icon>
                <SettingsIcon />
              </Icon>
              <Trans i18nKey="settings" defaults="Settings" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewSpaceDialog {...newSpaceDialog.dialogProps} />
    </>
  );
}
