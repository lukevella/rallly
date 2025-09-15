"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

interface LeaveSpaceDialogProps extends DialogProps {
  spaceName: string;
  onConfirm: () => Promise<void> | void;
}

export function LeaveSpaceDialog({
  spaceName,
  onConfirm,
  children,
  ...rest
}: LeaveSpaceDialogProps) {
  const { t } = useTranslation();

  const formSchema = React.useMemo(
    () =>
      z.object({
        spaceName: z
          .string()
          .transform((s) => s.trim())
          .refine((val) => val === spaceName, {
            error: t("spaceNameMismatch", {
              defaultValue: "Space name does not match",
            }),
          }),
      }),
    [spaceName, t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { spaceName: "" },
  });

  return (
    <Form {...form}>
      <Dialog {...rest}>
        {children}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="leaveSpace" defaults="Leave Space" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="leaveSpaceDescription"
                defaults="Are you sure you want to leave this space? You will no longer have access to its polls and data."
              />
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(async () => {
              await onConfirm();
              form.reset();
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="spaceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      i18nKey="confirmSpaceName"
                      defaults="Please type the space name to confirm:"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      data-1p-ignore
                      error={!!form.formState.errors.spaceName}
                      placeholder={spaceName}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button>
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
              </DialogClose>
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                variant="destructive"
              >
                <Trans i18nKey="leaveSpace" defaults="Leave Space" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
