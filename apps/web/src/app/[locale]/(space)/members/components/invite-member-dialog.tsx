"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { inviteMemberAction } from "@/features/space/actions";
import { SpaceRole } from "@/features/space/components/space-role";
import { spaceMemberRoleSchema } from "@/features/space/schema";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const inviteMemberFormSchema = z.object({
  email: z.string().email(),
  role: spaceMemberRoleSchema,
});

export function InviteMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof inviteMemberFormSchema>>({
    defaultValues: {
      email: "",
      role: "member",
    },
    resolver: zodResolver(inviteMemberFormSchema),
  });

  const inviteMember = useSafeAction(inviteMemberAction, {
    onSuccess: (result) => {
      const data = result.data;
      if (data.success) {
        switch (data.code) {
          case "INVITE_SENT":
            toast.success(
              t("inviteSent", {
                defaultValue: "Invitation sent",
              }),
            );
            form.reset();
            break;
          case "INVITE_UPDATED":
            toast.success(
              t("inviteUpdated", {
                defaultValue: "Invitation updated with new role",
              }),
            );
            form.reset();
            break;
        }
        onSuccess?.();
      } else {
        switch (data.code) {
          case "ALREADY_MEMBER":
            form.setError("email", {
              type: "manual",
              message: t("alreadyMember", {
                defaultValue: "This person is already a member of this space",
              }),
            });
            break;
          case "INVITE_PENDING":
            form.setError("email", {
              type: "manual",
              message: t("invitePending", {
                defaultValue:
                  "An invitation has already been sent to this email address",
              }),
            });
            break;
          case "INVITE_FAILED":
            form.setError("root", {
              type: "manual",
              message: t("inviteFailed", {
                defaultValue: "Failed to send invitation",
              }),
            });
            break;
        }
      }
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => inviteMember.execute(data))}>
        <fieldset className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="email" defaults="Email" />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("emailPlaceholder")}
                    data-1p-ignore
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="role" defaults="Role" />
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(spaceMemberRoleSchema.Values).map(
                        (role) => (
                          <SelectItem key={role} value={role}>
                            <SpaceRole role={role} />
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormMessage />
        </fieldset>
        <div className="mt-6">
          <Button
            variant="primary"
            loading={inviteMember.isExecuting}
            type="submit"
          >
            <Trans i18nKey="inviteMember" defaults="Send invite" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function InviteMemberDialog(props: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="inviteMember" defaults="Invite member" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteMemberDescription"
              defaults="Invite a new member to your space"
            />
          </DialogDescription>
        </DialogHeader>
        <InviteMemberForm
          onSuccess={() => {
            props.onOpenChange?.(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
