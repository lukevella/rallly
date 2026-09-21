"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordManagerIgnoreProps } from "@rallly/ui";
import { Alert, AlertDescription } from "@rallly/ui/alert";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { AlertTriangleIcon, CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useCopyToClipboard } from "react-use";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { createWebhookAction } from "../actions";
import { createWebhookInputSchema, WEBHOOK_EVENT_TYPES } from "../schema";
import { WebhookEventCombobox } from "./webhook-event-combobox";

export function CreateWebhookButton() {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const createWebhook = useSafeAction(createWebhookAction);
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(createWebhookInputSchema),
    defaultValues: {
      url: "",
      events: [...WEBHOOK_EVENT_TYPES],
    },
  });

  const handleClose = () => {
    dialog.dismiss();
    setCreatedSecret(null);
    form.reset();
  };

  const handleCopy = () => {
    if (createdSecret) {
      copy(createdSecret);
      setDidCopy(true);
      setTimeout(() => setDidCopy(false), 2000);
      toast.success(
        t("copiedToClipboard", {
          defaultValue: "Copied to clipboard",
        }),
      );
    }
  };

  return (
    <>
      <Button onClick={() => dialog.trigger()}>
        <PlusIcon data-icon="inline-start" />
        <Trans i18nKey="addEndpoint" defaults="Add endpoint" />
      </Button>
      <Dialog {...dialog.dialogProps} onOpenChange={handleClose}>
        <DialogContent>
          {createdSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <Trans i18nKey="endpointAdded" defaults="Endpoint added" />
                </DialogTitle>
                <DialogDescription>
                  <Trans
                    i18nKey="endpointAddedDescription"
                    defaults="Copy your signing secret now. You won't be able to see it again."
                  />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="warning">
                  <AlertTriangleIcon />
                  <AlertDescription>
                    <Trans
                      i18nKey="webhookSecretSecurityWarning"
                      defaults="Store this secret securely. Use it to verify that deliveries came from Rallly."
                    />
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <label
                    htmlFor="created-webhook-secret"
                    className="font-medium text-sm"
                  >
                    <Trans i18nKey="signingSecret" defaults="Signing secret" />
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="created-webhook-secret"
                      value={createdSecret}
                      readOnly
                      className="font-mono text-sm"
                      {...passwordManagerIgnoreProps}
                    />
                    <Button
                      aria-label={t("copy", { defaultValue: "Copy" })}
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      type="button"
                    >
                      {didCopy ? <CheckIcon /> : <CopyIcon />}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>
                  <Trans i18nKey="done" defaults="Done" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  <Trans i18nKey="addEndpoint" defaults="Add endpoint" />
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(async (data) => {
                    const result = await createWebhook.executeAsync(data);
                    if (result?.data?.ok) {
                      setCreatedSecret(result.data.secret);
                      form.reset();
                    } else if (
                      result?.data?.reason === "max_webhooks_exceeded"
                    ) {
                      toast.error(
                        t("webhookLimitReached", {
                          defaultValue:
                            "You've reached the maximum number of endpoints. Delete one before adding another.",
                        }),
                      );
                    }
                  })}
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans
                              i18nKey="endpointUrl"
                              defaults="Endpoint URL"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              inputMode="url"
                              placeholder="https://"
                              autoFocus
                              {...passwordManagerIgnoreProps}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="events"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans i18nKey="events" defaults="Events" />
                          </FormLabel>
                          <FormControl>
                            <WebhookEventCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="mt-6">
                    <DialogClose render={<Button />}>
                      <Trans i18nKey="cancel" defaults="Cancel" />
                    </DialogClose>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={createWebhook.isExecuting}
                      loading={createWebhook.isExecuting}
                    >
                      <Trans i18nKey="addWebhook" defaults="Add webhook" />
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
