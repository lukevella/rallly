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
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { LinkIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCopyToClipboard } from "react-use";
import { useDeleteParticipant } from "@/features/poll/components/mutations";
import { Trans, useTranslation } from "@/i18n/client";

export function PollResponseActions({
  participantId,
  participantName,
  editUrl,
  pollOpen,
  onDelete,
}: {
  participantId: string;
  participantName: string;
  editUrl: string;
  pollOpen: boolean;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const deleteDialog = useDialog();
  const deleteParticipant = useDeleteParticipant();
  const [, copy] = useCopyToClipboard();

  return (
    <div className="relative z-10">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("pollResponseActions", {
                defaultValue: "Actions for {name}",
                name: participantName,
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
          <DropdownMenuItem
            onClick={() => {
              copy(editUrl);
              toast(
                t("participantEditLinkCopied", {
                  defaultValue: "Edit link for {name} copied",
                  name: participantName,
                }),
              );
            }}
          >
            <LinkIcon />
            <Trans i18nKey="copyEditLink" defaults="Copy edit link" />
          </DropdownMenuItem>
          {/* A closed or scheduled poll accepts no changes to its responses */}
          <DropdownMenuItem
            variant="destructive"
            disabled={!pollOpen}
            onClick={() => deleteDialog.trigger()}
            className="items-start"
          >
            <TrashIcon className="mt-0.5" />
            <span className="flex flex-col">
              <Trans i18nKey="delete" defaults="Delete" />
              {pollOpen ? null : (
                <span className="text-muted-foreground text-xs">
                  <Trans
                    i18nKey="pollResponseActionsDeleteClosed"
                    defaults="Reopen the poll to delete responses"
                  />
                </span>
              )}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...deleteDialog.dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey="deleteParticipant"
                defaults="Delete {name}?"
                values={{ name: participantName }}
              />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="deleteParticipantDescription"
                defaults="Are you sure you want to delete this participant? This action cannot be undone."
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
            <Button
              variant="destructive"
              loading={deleteParticipant.isPending}
              onClick={async () => {
                const result = await deleteParticipant.execute({
                  participantId,
                });
                if (!result.ok) {
                  toast.error(
                    result.reason === "closed"
                      ? t("pollClosedDescription", {
                          defaultValue: "No more responses are being accepted.",
                        })
                      : t("actionErrorInternalServerError", {
                          defaultValue: "An internal server error occurred",
                        }),
                  );
                  return;
                }
                deleteDialog.dismiss();
                toast(
                  t("pollResponseDeleted", {
                    defaultValue: "Response from {name} deleted",
                    name: participantName,
                  }),
                );
                if (onDelete) {
                  onDelete();
                } else {
                  // The admin pages are server rendered, so the list only
                  // drops the row once they are fetched again.
                  router.refresh();
                }
              }}
            >
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
