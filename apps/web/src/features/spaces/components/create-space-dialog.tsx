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
import { toast } from "@rallly/ui/sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { createSpaceAction } from "@/features/spaces/actions";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const createSpaceFormSchema = z.object({
  name: z.string().min(1).max(100),
});

type CreateSpaceFormValues = z.infer<typeof createSpaceFormSchema>;

export function CreateSpaceDialog(props: DialogProps) {
  const { t } = useTranslation();

  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(createSpaceFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const createSpace = useSafeAction(createSpaceAction, {
    onSuccess: () => {
      form.reset();
    },
  });

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
            onSubmit={form.handleSubmit(({ name }) => {
              props.onOpenChange?.(false);
              toast.promise(
                createSpace.executeAsync({
                  name,
                }),
                {
                  loading: t("createSpaceLoading", {
                    defaultValue: "Creating space...",
                  }),
                  success: t("createSpaceSuccess", {
                    defaultValue: "Space created successfully",
                  }),
                  error: t("createSpaceError", {
                    defaultValue: "Failed to create space",
                  }),
                },
              );
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
