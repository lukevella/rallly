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
import { CheckIcon, XIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SpaceRole } from "@/features/space/components/space-role";
import { inviteMemberAction } from "@/features/space/member/actions";
import type { MemberRole } from "@/features/space/schema";
import { memberRoleSchema } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

function useInviteMemberFormSchema() {
  const { t } = useTranslation();

  return React.useMemo(() => {
    return z.object({
      email: z.email({
        message: t("invalidEmailAddress", {
          defaultValue: "Please enter a valid email address",
        }),
      }),
      role: memberRoleSchema,
    });
  }, [t]);
}

function RolePermission({
  allowed,
  children,
}: {
  allowed: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      {allowed ? (
        <CheckIcon className="size-4 shrink-0 text-green-600" />
      ) : (
        <XIcon className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="sr-only">
        {allowed ? (
          <Trans
            i18nKey="inviteMemberDialogPermissionAllowed"
            defaults="Allowed:"
          />
        ) : (
          <Trans
            i18nKey="inviteMemberDialogPermissionNotAllowed"
            defaults="Not allowed:"
          />
        )}
      </span>
      <span className={allowed ? undefined : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

function RolePermissions({ role, id }: { role: MemberRole; id?: string }) {
  const isAdmin = role === "admin";
  return (
    <ul
      id={id}
      aria-live="polite"
      aria-atomic="true"
      className="mt-2 grid gap-2 rounded-lg border border-card-border bg-card p-3 text-sm"
    >
      <RolePermission allowed={true}>
        <Trans
          i18nKey="inviteMemberDialogPermissionPollsEvents"
          defaults="Create and manage polls and events"
        />
      </RolePermission>
      <RolePermission allowed={isAdmin}>
        <Trans
          i18nKey="inviteMemberDialogPermissionMembers"
          defaults="Invite and remove members"
        />
      </RolePermission>
      <RolePermission allowed={isAdmin}>
        <Trans
          i18nKey="inviteMemberDialogPermissionSettings"
          defaults="Manage space settings"
        />
      </RolePermission>
    </ul>
  );
}

export function InviteMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const formSchema = useInviteMemberFormSchema();
  const rolePermissionsId = React.useId();

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as const,
    },
    resolver: zodResolver(formSchema),
  });

  const inviteMember = useSafeAction(inviteMemberAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        return;
      }

      if (data.ok) {
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
        switch (data.reason) {
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
          case "NOT_ENOUGH_SEATS":
            form.setError("root", {
              type: "manual",
              message: t("inviteNotEnoughSeats", {
                defaultValue:
                  "There are not enough seats available to send this invite",
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
        <div className="space-y-4">
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
                  <Select
                    items={Object.values(memberRoleSchema.enum).map((role) => ({
                      value: role,
                      label: <SpaceRole role={role} />,
                    }))}
                    onValueChange={(value) => {
                      if (value) {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-describedby={rolePermissionsId}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(memberRoleSchema.enum).map((role) => (
                        <SelectItem key={role} value={role}>
                          <SpaceRole role={role} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <RolePermissions role={field.value} id={rolePermissionsId} />
              </FormItem>
            )}
          />
          <FormMessage />
        </div>
        <div className="mt-4 flex">
          <Button
            variant="primary"
            loading={inviteMember.isExecuting}
            type="submit"
          >
            <Trans i18nKey="inviteMemberFormSubmit" defaults="Send invite" />
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
