"use client";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { deleteUser } from "../actions";

const useSchema = (email: string) => {
  const { t } = useTranslation();
  return z.object({
    email: z
      .string()
      .email()
      .refine((value) => value.toLowerCase() === email.toLowerCase(), {
        message: t("emailDoesNotMatch", {
          defaultValue: "The email address does not match.",
        }),
      }),
  });
};

export function DeleteUserDialog({
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
  const router = useRouter();
  const schema = useSchema(email);
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="deleteUserTitle" defaults="Delete User" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteUserDesc"
              defaults="Are you sure you want to delete this user?"
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              startTransition(async () => {
                await deleteUser({ userId, email: data.email });
                router.refresh();
                onOpenChange(false);
              });
            })}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="email" defaults="Email" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={email} {...field} />
                  </FormControl>
                  <FormDescription>
                    <Trans
                      i18nKey="deleteUserHint"
                      defaults="Type <b>{email}</b> to delete this user."
                      values={{ email }}
                      components={{
                        b: <b className="whitespace-nowrap font-normal" />,
                      }}
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button>
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
              </DialogClose>
              <Button variant="destructive" loading={isPending} type="submit">
                <Trans i18nKey="delete" defaults="Delete" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
