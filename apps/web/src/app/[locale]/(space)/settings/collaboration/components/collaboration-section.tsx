"use client";

import { cn } from "@rallly/ui";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rallly/ui/field";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { EyeIcon, UsersIcon } from "lucide-react";
import React from "react";
import {
  PageSection,
  PageSectionContent,
  PageSectionGroup,
} from "@/components/page-layout";
import { SettingIcon } from "@/components/setting-icon";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { updateSpaceSharedAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function CollaborationSection() {
  const { data: space } = useSpace();
  const { t } = useTranslation();
  const isFree = useIsFree();
  const isAdmin = space.role === "admin";

  const updateShared = useSafeAction(updateSpaceSharedAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [optimisticShared, setOptimisticShared] = React.useOptimistic(
    space.shared,
  );

  // Toggling changes what every member can see the moment it saves, so the
  // switch only stages the change; nothing persists until Save is pressed.
  const [pendingShared, setPendingShared] = React.useState<boolean | null>(
    null,
  );

  const checked = pendingShared ?? optimisticShared;
  const isDirty = pendingShared !== null && pendingShared !== optimisticShared;
  const showSaveButton = isDirty && isAdmin;

  const handleToggle = (nextShared: boolean) => {
    if (nextShared && isFree) {
      showPayWall({ from: "space-collaboration" });
      return;
    }

    setPendingShared(nextShared === optimisticShared ? null : nextShared);
  };

  const handleSave = () => {
    if (pendingShared === null) {
      return;
    }

    const next = pendingShared;

    React.startTransition(async () => {
      setOptimisticShared(next);
      setPendingShared(null);
      const result = await updateShared.executeAsync({ shared: next });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return (
    <PageSectionGroup>
      {!isAdmin ? (
        <Alert variant="note">
          <EyeIcon />
          <AlertDescription>
            <Trans
              i18nKey="generalSettingsAdminRoleRequired"
              defaults="You need to be an admin to make changes to this space."
            />
          </AlertDescription>
        </Alert>
      ) : null}
      <PageSection variant="card">
        <PageSectionContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <SettingIcon>
                <UsersIcon />
              </SettingIcon>
              <FieldContent>
                <FieldLabel htmlFor="space-shared">
                  <Trans i18nKey="workTogether" defaults="Work together" />
                  {space.tier !== "pro" && <ProBadge />}
                </FieldLabel>
                <FieldDescription>
                  <Trans
                    i18nKey="workTogetherDescription"
                    defaults="Give members full access to everything created in this space."
                  />
                </FieldDescription>
              </FieldContent>
              <div className="flex items-center gap-3">
                {/* Kept mounted so the row doesn't shift when it appears;
                    `invisible` also keeps it out of the tab order. */}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSave}
                  loading={updateShared.isExecuting}
                  className={cn(!showSaveButton && "invisible")}
                >
                  <Trans i18nKey="save" defaults="Save" />
                </Button>
                <Switch
                  id="space-shared"
                  checked={checked}
                  onCheckedChange={handleToggle}
                  disabled={!isAdmin || updateShared.isExecuting}
                />
              </div>
            </Field>
          </FieldGroup>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
