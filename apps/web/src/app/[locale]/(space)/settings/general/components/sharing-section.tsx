"use client";

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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { UsersIcon } from "lucide-react";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { SettingIcon } from "@/components/setting-icon";
import { updateSpaceSharedAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function SharingSection({ disabled = false }: { disabled?: boolean }) {
  const { data: space } = useSpace();
  const { t } = useTranslation();

  const updateShared = useSafeAction(updateSpaceSharedAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [shared, setOptimisticShared] = React.useOptimistic(space.shared);

  // Toggling changes what every member can see the moment it saves, and
  // turning sharing on exposes content that was private until then — so
  // the toggle is staged behind a confirmation dialog instead of saving on
  // change. The switch keeps showing the committed value until confirmed.
  const confirmDialog = useDialog();
  const [pendingShared, setPendingShared] = React.useState<boolean | null>(
    null,
  );

  const handleToggle = (nextShared: boolean) => {
    if (nextShared === shared) {
      return;
    }

    setPendingShared(nextShared);
    confirmDialog.trigger();
  };

  const handleConfirm = () => {
    if (pendingShared === null) {
      return;
    }

    const next = pendingShared;
    confirmDialog.dismiss();

    React.startTransition(async () => {
      setOptimisticShared(next);
      const result = await updateShared.executeAsync({ shared: next });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="spaceSharingTitle" defaults="Sharing" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="spaceSharingDescription"
            defaults="How members work in this space"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <SettingIcon>
              <UsersIcon />
            </SettingIcon>
            <FieldContent>
              <FieldLabel htmlFor="space-shared">
                <Trans i18nKey="spaceSharedLabel" defaults="Shared space" />
              </FieldLabel>
              <FieldDescription>
                <Trans
                  i18nKey="spaceSharedHint"
                  defaults="Members see everything created in this space."
                />
              </FieldDescription>
            </FieldContent>
            <Switch
              id="space-shared"
              checked={shared}
              onCheckedChange={handleToggle}
              disabled={disabled || updateShared.isExecuting}
            />
          </Field>
        </FieldGroup>
        <Dialog {...confirmDialog.dialogProps}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>
                {pendingShared ? (
                  <Trans
                    i18nKey="spaceSharedConfirmOnTitle"
                    defaults="Turn on sharing?"
                  />
                ) : (
                  <Trans
                    i18nKey="spaceSharedConfirmOffTitle"
                    defaults="Turn off sharing?"
                  />
                )}
              </DialogTitle>
              <DialogDescription>
                {pendingShared ? (
                  <Trans
                    i18nKey="spaceSharedConfirmOnDescription"
                    defaults="Everyone in this space will immediately see everything created in it, including polls and events created before now."
                  />
                ) : (
                  <Trans
                    i18nKey="spaceSharedConfirmOffDescription"
                    defaults="Everyone in this space, including you and other admins, will only see what they create themselves."
                  />
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button />}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button variant="primary" onClick={handleConfirm}>
                {pendingShared ? (
                  <Trans i18nKey="spaceSharedConfirmOn" defaults="Turn on" />
                ) : (
                  <Trans i18nKey="spaceSharedConfirmOff" defaults="Turn off" />
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageSectionContent>
    </PageSection>
  );
}
