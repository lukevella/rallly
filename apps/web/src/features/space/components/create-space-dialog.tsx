"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
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
import { createSpaceAction } from "@/features/space/actions";
import { createSpaceSchema } from "@/features/space/schema";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function CreateSpaceDialog(props: DialogProps) {
  const form = useForm({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createSpace = useSafeAction(createSpaceAction);

  return (
    <Dialog {...props}>
      <Form {...form}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="createSpace" defaults="Create Space" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="createSpaceDescription"
                defaults="Create a new space to organize your polls and events."
              />
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(async ({ name }) => {
              const result = await createSpace.executeAsync({ name });
              if (result?.data) {
                props.onOpenChange?.(false);
                form.reset();
              }
            })}
          >
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
                      data-1p-ignore="true"
                      placeholder="e.g. Acme Corp"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                loading={form.formState.isSubmitting}
                type="submit"
                variant="primary"
              >
                <Trans i18nKey="createSpace" defaults="Create Space" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
}
