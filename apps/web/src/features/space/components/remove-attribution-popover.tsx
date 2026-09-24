"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@rallly/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { XIcon } from "lucide-react";
import { useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { useHideAttributionToggle } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Dismiss control rendered inside the "Powered by" badge on the poll admin
 * page. Attribution is a space setting, so the popover says so and points
 * at where it lives; the switch is a convenience for Pro admins and the
 * upgrade button routes free admins to the pay wall.
 */
export function RemoveAttributionPopover({ pollId }: { pollId: string }) {
  const isFree = useIsFree();
  const { t } = useTranslation();
  // Dismissed before opening the pay wall so the dialog doesn't stack on it
  const popover = useDialog();
  const { isPending, toggle } = useHideAttributionToggle({
    // The badge is only rendered while attribution is shown
    hideAttribution: false,
    payWallTrigger: {
      from: "poll-footer",
      setting: "hide_attribution",
      pollId,
    },
  });

  return (
    <Popover {...popover.dialogProps}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-5 rounded-full text-muted-foreground hover:text-foreground"
            aria-label={t("removeAttribution", {
              defaultValue: "Remove attribution",
            })}
          />
        }
        onClick={() => {
          posthog?.capture("poll_admin:remove_attribution_click", {
            poll_id: pollId,
          });
        }}
      >
        <XIcon className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="center" side="top" sideOffset={8}>
        <Field>
          <FieldLabel>
            <Trans
              i18nKey="removeAttributionSettingTitle"
              defaults="Remove attribution"
            />
            {isFree ? <ProBadge /> : null}
          </FieldLabel>
          <FieldDescription>
            <Trans
              i18nKey="removeAttributionSettingDescription"
              defaults='Hide "Powered by Rallly" on invite pages and participant emails.'
            />
          </FieldDescription>
        </Field>
        {isFree ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              popover.dismiss();
              toggle(true);
            }}
          >
            <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            disabled={isPending}
            onClick={() => toggle(true)}
          >
            <Trans i18nKey="remove" defaults="Remove" />
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
