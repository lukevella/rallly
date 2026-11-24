"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { unlinkSignInAccountAction } from "@/features/user/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

export function UnlinkSignInAccountButton({
  accountId,
  providerName,
  email,
}: {
  accountId: string;
  providerName: string;
  email: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const dialog = useDialog();
  const isCalendarsEnabled = useFeatureFlag("calendars");

  const unlink = useMutation(
    mutationOptions(unlinkSignInAccountAction, {
      onSuccess: (result) => {
        if (!result.ok) {
          return;
        }
        dialog.dismiss();
        toast.success(
          t("signInAccountRemoved", {
            defaultValue: "Sign-in account removed",
          }),
        );
      },
    }),
  );
  const needsFreshSession = unlink.data?.ok === false;

  return (
    <Dialog
      {...dialog.dialogProps}
      onOpenChange={(open) => {
        dialog.dialogProps.onOpenChange(open);
        if (!open) {
          unlink.reset();
        }
      }}
    >
      <Button onClick={() => dialog.trigger()}>
        <Trans i18nKey="remove" defaults="Remove" />
      </Button>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="removeSignInAccountTitle"
              defaults="Remove sign-in account"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="removeSignInAccountDescription"
              defaults="You will not be able to sign in with this {provider} account. You can still sign in with a code sent to {email}."
              values={{ provider: providerName, email }}
            />{" "}
            {isCalendarsEnabled ? (
              <Trans
                i18nKey="removeSignInAccountCalendarsNote"
                defaults="Connected calendars are not affected."
              />
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {needsFreshSession ? (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              <Trans
                i18nKey="removeSignInAccountSessionNotFresh"
                defaults="For your security, sign in again before you remove this account."
              />
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          {needsFreshSession ? (
            <Button
              variant="primary"
              onClick={async () => {
                await signOut();
                router.push(
                  buildSafeRedirectUrl({
                    destination: "/login",
                    returnUrl: "/settings/security",
                  }),
                );
              }}
            >
              <Trans i18nKey="signInAgain" defaults="Sign in again" />
            </Button>
          ) : (
            <Button
              variant="destructive"
              loading={unlink.isPending}
              onClick={() => {
                unlink.mutate({ accountId });
              }}
            >
              <Trans i18nKey="remove" defaults="Remove" />
            </Button>
          )}
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
