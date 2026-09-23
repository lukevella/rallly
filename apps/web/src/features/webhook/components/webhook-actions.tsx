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
import { Switch } from "@rallly/ui/switch";
import { MoreVerticalIcon, SendIcon, Trash2Icon } from "lucide-react";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  deleteWebhookAction,
  sendWebhookTestEventAction,
  setWebhookEnabledAction,
} from "../actions";

export function WebhookActions({
  webhookId,
  webhookUrl,
  enabled,
}: {
  webhookId: string;
  webhookUrl: string;
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const deleteDialog = useDialog();

  const setEnabled = useSafeAction(setWebhookEnabledAction);
  const sendTestEvent = useSafeAction(sendWebhookTestEventAction, {
    onExecute: () => {
      toast.loading(
        t("webhookTestEventSending", { defaultValue: "Sending test event" }),
        { id: `webhook-test-${webhookId}` },
      );
    },
    onSuccess: ({ data }) => {
      if (!data) {
        return;
      }
      const id = `webhook-test-${webhookId}`;
      if (data.ok) {
        toast.success(
          t("webhookTestEventDelivered", {
            defaultValue: "Test event delivered",
          }),
          {
            id,
            description: t("webhookTestEventRespondedWith", {
              defaultValue: "Endpoint responded {status}",
              status: data.status,
            }),
          },
        );
      } else {
        toast.error(
          t("webhookTestEventFailed", { defaultValue: "Test event failed" }),
          { id, description: data.error },
        );
      }
    },
    onError: () => {
      toast.dismiss(`webhook-test-${webhookId}`);
    },
  });
  const deleteWebhook = useSafeAction(deleteWebhookAction, {
    onSuccess: () => {
      toast.success(t("webhookDeleted", { defaultValue: "Webhook deleted" }));
    },
    onSettled: () => {
      deleteDialog.dismiss();
    },
  });

  return (
    <>
      <Switch
        checked={enabled}
        disabled={setEnabled.isExecuting}
        aria-label={t("enabled", { defaultValue: "Enabled" })}
        onCheckedChange={(checked) => {
          setEnabled.execute({ webhookId, enabled: checked });
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("moreOptions", { defaultValue: "More options" })}
              variant="ghost"
              size="icon"
            />
          }
        >
          <MoreVerticalIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={sendTestEvent.isExecuting}
            onClick={() => {
              sendTestEvent.execute({ webhookId });
            }}
          >
            <SendIcon />
            <Trans i18nKey="webhookSendTestEvent" defaults="Send test event" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              deleteDialog.trigger();
            }}
            variant="destructive"
          >
            <Trash2Icon />
            <Trans i18nKey="delete" defaults="Delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...deleteDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="deleteWebhook" defaults="Delete webhook" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="deleteWebhookConfirmation"
                defaults="Are you sure you want to delete {url}? Rallly will stop sending events to it immediately."
                values={{ url: webhookUrl }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={deleteWebhook.isExecuting}
              onClick={() => {
                deleteWebhook.execute({ webhookId });
              }}
            >
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
