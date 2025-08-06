"use client";

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
import { CirclePlusIcon, SettingsIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Trans } from "@/components/trans";
import { setActiveSpaceAction } from "@/features/space/actions";
import { useSafeAction } from "@/lib/safe-action/client";
import { CreateSpaceDialog } from "./create-space-dialog";
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
    image?: string;
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
        <DropdownMenuTrigger asChild={Boolean(children)}>
          {children}
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
          <DropdownMenuItem asChild>
            <Link href="/settings/general">
              <Icon>
                <SettingsIcon />
              </Icon>
              <Trans i18nKey="spaceSettings" defaults="Space Settings" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/members">
              <Icon>
                <UserPlusIcon />
              </Icon>
              <Trans i18nKey="inviteMembers" defaults="Invite Members" />
            </Link>
          </DropdownMenuItem>
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
