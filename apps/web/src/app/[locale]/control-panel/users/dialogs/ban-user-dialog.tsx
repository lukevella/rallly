"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
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
import { Textarea } from "@rallly/ui/textarea";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { banUserAction } from "@/features/user/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const useSchema = () => {
  const { t } = useTranslation();
  return z.object({
    reason: z
      .string()
      .trim()
      .max(500, {
        error: t("banUserReasonTooLong", {
          defaultValue: "Reason must be 500 characters or fewer",
        }),
      }),
  });
};

export function BanUserDialog({
  userId,
  email,
  open,
  onOpenChange,
}: {
  userId: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const schema = useSchema();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "",
    },
  });

  const banUser = useSafeAction(banUserAction, {
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="banUserTitle" defaults="Ban User" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="banUserDesc"
              defaults="Are you sure you want to ban <b>{email}</b>? They will be signed out and won't be able to log in."
              values={{ email }}
              components={{
                b: <b className="whitespace-nowrap font-normal" />,
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await banUser.executeAsync({
                userId,
                reason: data.reason || undefined,
              });
            })}
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      i18nKey="banUserReason"
                      defaults="Reason (optional)"
                    />
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <DialogClose render={<Button />}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button
                variant="destructive"
                loading={banUser.isExecuting}
                type="submit"
              >
                <Trans i18nKey="banUser" defaults="Ban user" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
