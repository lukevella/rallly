"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { buttonVariants, passwordManagerIgnoreProps } from "@rallly/ui";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Link } from "@/components/link";
import { SpaceRole } from "@/features/space/components/space-role";
import { inviteMemberAction } from "@/features/space/member/actions";
import type { MemberRole } from "@/features/space/schema";
import { memberRoleSchema } from "@/features/space/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

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

  const inviteMember = useMutation(
    mutationOptions(inviteMemberAction, {
      onSuccess: (data) => {
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
    }),
  );
  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((data) => inviteMember.mutate(data))}
      >
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
                    {...passwordManagerIgnoreProps}
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
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="primary"
            loading={inviteMember.isPending}
            type="submit"
          >
            <Trans i18nKey="inviteMemberFormSubmit" defaults="Send invite" />
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function NoSeatsAvailableDialogContent({
  canManageBilling,
}: {
  canManageBilling: boolean;
}) {
  const isBillingEnabled = useFeatureFlag("billing");

  if (!isBillingEnabled) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="noSeatsAvailable" defaults="No seats available" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="noSeatsAvailableSelfHostedDescription"
              defaults="Every seat on this instance's license is in use. Upgrade the license to add more members."
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Link
            className={buttonVariants({ variant: "primary" })}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            href="https://support.rallly.co/self-hosting/licensing"
          >
            <Trans i18nKey="upgrade" defaults="Upgrade" />
          </Link>
        </DialogFooter>
      </>
    );
  }

  if (!canManageBilling) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="noSeatsAvailable" defaults="No seats available" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="noSeatsAvailableAskOwnerDescription"
              defaults="Every seat in this space is in use. Ask the space owner to add more seats."
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="close" defaults="Close" />
          </DialogClose>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <Trans i18nKey="noSeatsAvailable" defaults="No seats available" />
        </DialogTitle>
        <DialogDescription>
          <Trans
            i18nKey="noSeatsAvailableOwnerDescription"
            defaults="Every seat in this space is in use. Add seats to invite more members."
          />
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button />}>
          <Trans i18nKey="cancel" defaults="Cancel" />
        </DialogClose>
        <Link
          className={buttonVariants({ variant: "primary" })}
          href="/settings/billing"
        >
          <Trans i18nKey="noSeatsAvailableAddSeats" defaults="Add seats" />
        </Link>
      </DialogFooter>
    </>
  );
}

export function InviteMemberDialog({
  noSeatsAvailable,
  canManageBilling,
  ...props
}: DialogProps & { noSeatsAvailable: boolean; canManageBilling: boolean }) {
  return (
    <Dialog {...props}>
      <DialogContent size="sm">
        {noSeatsAvailable ? (
          <NoSeatsAvailableDialogContent canManageBilling={canManageBilling} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="addMember" defaults="Add member" />
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
