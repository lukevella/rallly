"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
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
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { AlertTriangleIcon, CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCopyToClipboard } from "react-use";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().min(1).max(100),
});

type FormData = z.infer<typeof formSchema>;

export function CreateApiKeyButton() {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const createApiKey = trpc.apiKeys.create.useMutation();
  const utils = trpc.useUtils();
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleClose = () => {
    dialog.dismiss();
    setCreatedApiKey(null);
    form.reset();
  };

  const handleCopy = () => {
    if (createdApiKey) {
      copy(createdApiKey);
      setDidCopy(true);
      setTimeout(() => setDidCopy(false), 2000);
      toast.success(
        t("copiedToClipboard", {
          defaultValue: "Copied to clipboard",
        }),
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createApiKey.mutateAsync(data);
      setCreatedApiKey(result.apiKey);
      await utils.apiKeys.list.invalidate();
      form.reset();
    } catch {
      toast.error(
        t("createFailed", {
          defaultValue: "Failed to create",
        }),
      );
    }
  };

  return (
    <>
      <Button onClick={() => dialog.trigger()}>
        <Icon>
          <PlusIcon />
        </Icon>
        <Trans i18nKey="createApiKey" defaults="Create API key" />
      </Button>
      <Dialog {...dialog.dialogProps} onOpenChange={handleClose}>
        <DialogContent>
          {createdApiKey ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <Trans i18nKey="apiKeyCreated" defaults="API key created" />
                </DialogTitle>
                <DialogDescription>
                  <Trans
                    i18nKey="apiKeyCreatedDescription"
                    defaults="Copy your API key now. You won't be able to see it again."
                  />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="warning">
                  <AlertTriangleIcon />
                  <AlertDescription>
                    <Trans
                      i18nKey="apiKeySecurityWarning"
                      defaults="Store this key securely. It won't be shown again."
                    />
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <label
                    htmlFor="created-api-key"
                    className="font-medium text-sm"
                  >
                    <Trans i18nKey="yourApiKey" defaults="Your API key" />
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="created-api-key"
                      value={createdApiKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      type="button"
                    >
                      <Icon>{didCopy ? <CheckIcon /> : <CopyIcon />}</Icon>
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
                  <Trans i18nKey="createApiKey" defaults="Create API key" />
                </DialogTitle>
                <DialogDescription>
                  <Trans
                    i18nKey="createApiKeyDescription"
                    defaults="Create a new API key for programmatic access to your space"
                  />
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans i18nKey="name" defaults="Name" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("apiKeyNamePlaceholder", {
                                defaultValue: "My App",
                              })}
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={createApiKey.isPending}
                      loading={createApiKey.isPending}
                    >
                      <Trans i18nKey="create" defaults="Create" />
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
