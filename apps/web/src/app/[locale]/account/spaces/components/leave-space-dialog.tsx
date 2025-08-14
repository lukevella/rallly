"use client";

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
import { useForm } from "react-hook-form";

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
  const form = useForm<{ spaceName: string }>({
    defaultValues: {
      spaceName: "",
    },
  });

  const { t } = useTranslation();

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
            onSubmit={form.handleSubmit(async (data) => {
              console.log({ data });
              await onConfirm();
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="spaceName"
              rules={{
                validate: (value) => {
                  console.log({ value, spaceName });
                  if (value !== spaceName) {
                    return t("spaceNameMismatch", {
                      defaultValue: "Space name does not match",
                    });
                  }
                  return true;
                },
              }}
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
