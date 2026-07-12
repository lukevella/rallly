"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function DeleteEventTypeDialog({
  eventTypeId,
  eventTypeName,
  open,
  onOpenChange,
}: DialogProps & {
  eventTypeId: string;
  eventTypeName: string;
}) {
  const { t } = useTranslation();
  const softDelete = trpc.eventTypes.softDelete.useMutation();

  const handleDelete = async () => {
    try {
      await softDelete.mutateAsync({ id: eventTypeId });
    } catch {
      toast.error(
        t("deleteEventTypeError", {
          defaultValue: "Failed to delete event type",
        }),
      );
      return;
    }
    posthog?.capture("event_type_deletion:confirm");
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="deleteEventTypeTitle"
              defaults="Delete event type?"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteEventTypeDescription"
              defaults="<b>{name}</b> will be hidden from creation pickers. This cannot be undone."
              values={{ name: eventTypeName }}
              components={{
                b: <b className="font-semibold text-foreground" />,
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button type="button" disabled={softDelete.isPending} />}
          >
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={softDelete.isPending}
          >
            <Trans i18nKey="delete" defaults="Delete" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
