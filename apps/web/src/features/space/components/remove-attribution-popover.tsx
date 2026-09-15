"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@rallly/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@rallly/ui/popover";
import { Switch } from "@rallly/ui/switch";
import { XIcon } from "lucide-react";
import { Link } from "@/components/link";
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
export function RemoveAttributionPopover({
  spaceName,
  pollId,
}: {
  spaceName: string;
  pollId: string;
}) {
  const isFree = useIsFree();
  const { t } = useTranslation();
  const popover = useDialog();
  const { hideAttribution, isExecuting, toggle } = useHideAttributionToggle({
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
        <PopoverHeader>
          <PopoverTitle>
            <Trans i18nKey="removeAttribution" defaults="Remove attribution" />
            {isFree ? <ProBadge className="ml-2" /> : null}
          </PopoverTitle>
          <PopoverDescription>
            <Trans
              i18nKey="removeAttributionPopoverDescription"
              defaults="Hides this badge on every poll and email in {spaceName}."
              values={{ spaceName }}
            />
          </PopoverDescription>
        </PopoverHeader>
        {isFree ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              // Hand off to the pay wall rather than stacking on top of it
              popover.dismiss();
              toggle(true);
            }}
          >
            <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
          </Button>
        ) : (
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="poll-footer-hide-attribution">
                <Trans i18nKey="hideAttribution" defaults="Hide attribution" />
              </FieldLabel>
            </FieldContent>
            <Switch
              id="poll-footer-hide-attribution"
              checked={hideAttribution}
              onCheckedChange={toggle}
              disabled={isExecuting}
            />
          </Field>
        )}
        <p className="text-muted-foreground text-xs">
          <Trans
            i18nKey="removeAttributionPopoverSettingsHint"
            defaults="You can change this anytime in <a>General settings</a>."
            components={{
              a: (
                <Link
                  href="/settings/general"
                  className="text-foreground underline underline-offset-4"
                />
              ),
            }}
          />
        </p>
      </PopoverContent>
    </Popover>
  );
}
