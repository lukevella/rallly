"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import type { Color } from "@rallly/ui/color-picker";
import { ColorPicker } from "@rallly/ui/color-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Color swatch that opens a picker popover, with an inline save button that
 * appears when there are unsaved changes, and an optional reset-to-default
 * button (pass `onReset` to reserve its slot, `showReset` to reveal it).
 * Buttons stay mounted so the layout doesn't shift as they appear.
 */
export function ColorPickerWithSaveButton({
  value,
  onChange,
  isDirty,
  isSaving,
  onSave,
  onReset,
  showReset = false,
  disabled = false,
  "aria-labelledby": labelledBy,
}: {
  value: Color;
  onChange: (color: Color) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset?: () => void;
  showReset?: boolean;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {onReset ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn((!showReset || disabled) && "invisible")}
                onClick={onReset}
                aria-label={t("resetToDefault", {
                  defaultValue: "Reset to default",
                })}
              >
                <RotateCcwIcon />
              </Button>
            }
          />
          <TooltipContent>
            <Trans i18nKey="resetToDefault" defaults="Reset to default" />
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn((!isDirty || disabled) && "invisible")}
              onClick={onSave}
              loading={isSaving}
              aria-label={t("save", { defaultValue: "Save" })}
            >
              <CheckIcon />
            </Button>
          }
        />
        <TooltipContent>
          <Trans i18nKey="save" defaults="Save" />
        </TooltipContent>
      </Tooltip>
      <ColorPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelledBy}
      />
    </div>
  );
}
