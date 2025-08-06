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
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Trans } from "@/components/trans";
import { deleteSpaceAction } from "@/features/space/actions";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

interface DeleteSpaceDialogProps extends DialogProps {
  spaceName: string;
  spaceId: string;
}

function DeleteSpaceDialog({
  spaceName,
  spaceId,
  children,
  ...rest
}: DeleteSpaceDialogProps) {
  const form = useForm<{ spaceName: string }>({
    defaultValues: {
      spaceName: "",
    },
  });

  const deleteSpace = useSafeAction(deleteSpaceAction, {
    onSuccess: () => {
      toast.success(
        t("deletedSpaceSuccess", {
          defaultValue: "Space has been permanently deleted",
        }),
      );
      router.push("/");
    },
  });

  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <Dialog {...rest}>
        {children}
        <DialogContent>
          <form
            onSubmit={form.handleSubmit(() => {
              deleteSpace.execute({ spaceId });
            })}
          >
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="deleteSpaceDialogTitle"
                  defaults="Delete Space"
                />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="deleteSpaceDialogDescription"
                  defaults="This will permanently delete the space. This action cannot be undone."
                />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">
                <Trans
                  i18nKey="deleteSpaceInstruction"
                  defaults="Please type the space name to confirm: {{spaceName}}"
                  values={{ spaceName }}
                />
              </p>
              <FormField
                control={form.control}
                name="spaceName"
                rules={{
                  validate: (value) => {
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
                    <Input
                      autoComplete="off"
                      data-1p-ignore
                      error={!!form.formState.errors.spaceName}
                      placeholder={spaceName}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
              </DialogClose>
              <Button
                type="submit"
                loading={deleteSpace.isExecuting}
                variant="destructive"
              >
                <Trans
                  i18nKey="deleteSpacePermanently"
                  defaults="Delete Space Permanently"
                />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

interface DeleteSpaceButtonProps {
  spaceName: string;
  spaceId: string;
}

export function DeleteSpaceButton({
  spaceName,
  spaceId,
}: DeleteSpaceButtonProps) {
  return (
    <DeleteSpaceDialog spaceName={spaceName} spaceId={spaceId}>
      <DialogTrigger asChild>
        <Button className="text-destructive">
          <TrashIcon className="size-4" />
          <Trans i18nKey="deleteSpace" defaults="Delete Space" />
        </Button>
      </DialogTrigger>
    </DeleteSpaceDialog>
  );
}
