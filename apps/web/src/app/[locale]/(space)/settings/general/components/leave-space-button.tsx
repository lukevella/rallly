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
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Trans } from "@/components/trans";
import { leaveSpaceAction } from "@/features/space/actions";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

interface LeaveSpaceDialogProps extends DialogProps {
  spaceName: string;
  spaceId: string;
}

const formName = "leave-space-form";

function LeaveSpaceDialog({
  spaceName,
  spaceId,
  children,
  ...rest
}: LeaveSpaceDialogProps) {
  const form = useForm<{ spaceName: string }>({
    defaultValues: {
      spaceName: "",
    },
  });

  const leaveSpace = useSafeAction(leaveSpaceAction, {
    onSuccess: () => {
      toast.success(
        t("leftSpaceSuccess", {
          defaultValue: "You have left the space",
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
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="leaveSpaceDialogTitle" defaults="Leave Space" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="leaveSpaceDialogDescription"
                defaults="Are you sure you want to leave this space?"
              />
            </DialogDescription>
          </DialogHeader>
          <form
            id={formName}
            onSubmit={form.handleSubmit(() => {
              leaveSpace.execute();
            })}
          >
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
                  <FormLabel>
                    <Trans
                      i18nKey="leaveSpaceInstruction"
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
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
            </DialogClose>
            <Button
              form={formName}
              type="submit"
              loading={leaveSpace.isExecuting}
              variant="destructive"
            >
              <Trans i18nKey="leaveSpace" defaults="Leave Space" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

interface LeaveSpaceButtonProps {
  spaceName: string;
  spaceId: string;
}

export function LeaveSpaceButton({
  spaceName,
  spaceId,
}: LeaveSpaceButtonProps) {
  return (
    <LeaveSpaceDialog spaceName={spaceName} spaceId={spaceId}>
      <DialogTrigger asChild>
        <Button>
          <Icon>
            <LogOutIcon />
          </Icon>
          <Trans i18nKey="leaveSpace" defaults="Leave Space" />
        </Button>
      </DialogTrigger>
    </LeaveSpaceDialog>
  );
}
