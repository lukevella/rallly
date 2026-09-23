"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { shortUrl } from "@rallly/utils/absolute-url";
import { CalendarPlusIcon, MoreHorizontalIcon } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { AddToCalendarMenuItems } from "@/features/calendars/components/add-to-calendar-menu-items";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import type { ScheduledEventStatus } from "@/features/scheduled-event/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function ScheduledEventRowActions({
  eventId,
  status,
}: {
  eventId: string;
  status: ScheduledEventStatus;
}) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const cancelEvent = trpc.events.cancel.useMutation({
    onSuccess: () => {
      dialog.dismiss();
    },
  });

  return (
    <div className="relative z-10 flex items-center gap-x-1">
      {isScheduledEventEnabled && (
        <CopyLinkButton href={shortUrl(`/e/${eventId}`)} className="size-8" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("moreOptions", {
                defaultValue: "More options",
              })}
              variant="ghost"
              size="icon"
              className="size-8"
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CalendarPlusIcon />
              <Trans i18nKey="addToCalendar" defaults="Add to calendar" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <AddToCalendarMenuItems eventId={eventId} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {status !== "canceled" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => dialog.trigger()}
              >
                <Trans i18nKey="cancelEvent" defaults="Cancel event" />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="cancelEvent" defaults="Cancel event" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="cancelEventConfirmDescription"
                defaults="Are you sure you want to cancel this event?"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="default" />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
            <Button
              variant="destructive"
              loading={cancelEvent.isPending}
              onClick={() =>
                cancelEvent.mutate({
                  eventId,
                })
              }
            >
              <Trans i18nKey="cancelEvent" defaults="Cancel event" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
