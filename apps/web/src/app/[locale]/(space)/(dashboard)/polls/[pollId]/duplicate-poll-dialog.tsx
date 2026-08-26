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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { duplicatePollAction } from "@/features/poll/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const formSchema = z.object({
  title: z.string().trim().min(1),
});

const formName = "duplicate-poll-form";

export function DuplicatePollDialog({
  pollId,
  defaultTitle,
  ...props
}: DialogProps & { pollId: string; defaultTitle: string }) {
  const router = useRouter();
  const duplicatePoll = useSafeAction(duplicatePollAction, {
    onSuccess: ({ data }) => {
      if (data) {
        router.push(`/polls/${data.id}`);
      }
    },
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultTitle,
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="duplicate" defaults="Duplicate" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="duplicateDescription"
              defaults="Create a new poll based on this one"
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={formName}
            onSubmit={form.handleSubmit((data) => {
              duplicatePoll.execute({ pollId, title: data.title });
            })}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="duplicateTitleLabel" defaults="Title" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            type="submit"
            form={formName}
            variant="primary"
            loading={duplicatePoll.isExecuting}
          >
            <Trans i18nKey="duplicate" defaults="Duplicate" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
