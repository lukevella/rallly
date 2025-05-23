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
  DialogTrigger,
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
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { deleteUser } from "./actions";

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

export function DeleteUserButton({
  userId,
  email,
}: { userId: string; email: string }) {
  const router = useRouter();
  const schema = useSchema(email);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost">
          <Icon>
            <TrashIcon />
          </Icon>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="deleteUser" defaults="Delete User" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="areYouSureYouWantToDeleteThisUser"
              defaults="Are you sure you want to delete this user?"
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await deleteUser({ userId, email: data.email });
              router.refresh();
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
                      i18nKey="typeTheEmailAddressOfTheUserYouWantToDelete"
                      defaults="Type the email address of the user you want to delete."
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
              <Button variant="destructive" type="submit">
                <Trans i18nKey="delete" defaults="Delete" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
