"use client";

import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { CrownIcon, LayersIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { leaveSpaceFromAccountAction } from "@/features/space/actions";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { SpaceRole } from "@/features/space/components/space-role";
import type { SpaceDTO } from "@/features/space/types";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { LeaveSpaceDialog } from "./leave-space-dialog";

interface SpacesListProps {
  spaces: SpaceDTO[];
  currentUserId: string;
}

export function SpacesList({ spaces, currentUserId }: SpacesListProps) {
  const { t } = useTranslation();
  const leaveSpaceDialog = useDialog();
  const [selectedSpace, setSelectedSpace] = useState<SpaceDTO | null>(null);

  const leaveSpace = useSafeAction(leaveSpaceFromAccountAction, {
    onSuccess: () => {
      toast.success(
        t("leftSpaceSuccess", {
          defaultValue: "You have left the space",
        }),
      );
      leaveSpaceDialog.dismiss();
      setSelectedSpace(null);
    },
  });

  const handleLeaveSpace = (space: SpaceDTO) => {
    setSelectedSpace(space);
    leaveSpaceDialog.trigger();
  };

  if (spaces.length === 0) {
    return (
      <Card>
        <EmptyState>
          <EmptyStateIcon>
            <LayersIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans i18nKey="noSpaces" defaults="No spaces found" />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <Trans
              i18nKey="noSpacesDescription"
              defaults="You are not a member of any spaces yet"
            />
          </EmptyStateDescription>
        </EmptyState>
      </Card>
    );
  }

  return (
    <>
      <StackedList>
        {spaces.map((space) => {
          const isOwner = space.ownerId === currentUserId;
          return (
            <StackedListItem key={space.id}>
              <div className="flex flex-1 items-center gap-4">
                <SpaceIcon src={space.image} name={space.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-sm">
                      {space.name}
                    </h3>
                    {isOwner && <CrownIcon className="size-4 text-amber-500" />}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    <SpaceRole role={space.role} />
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Icon>
                      <MoreHorizontalIcon />
                    </Icon>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={isOwner}
                    variant="destructive"
                    onClick={() => handleLeaveSpace(space)}
                  >
                    <Trans i18nKey="leaveSpace" defaults="Leave Space" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </StackedListItem>
          );
        })}
      </StackedList>
      {selectedSpace && (
        <LeaveSpaceDialog
          {...leaveSpaceDialog.dialogProps}
          spaceName={selectedSpace.name}
          onConfirm={async () => {
            await leaveSpace.executeAsync({ spaceId: selectedSpace.id });
          }}
        />
      )}
    </>
  );
}
