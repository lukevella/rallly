"use client";

import { cn } from "@rallly/ui";
import type { Color } from "@rallly/ui/color-picker";
import { ColorPicker } from "@rallly/ui/color-picker";
import { InputGroupButton } from "@rallly/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Color picker with an inline save button that appears when there are
 * unsaved changes, and an optional reset-to-default button (pass `onReset`
 * to reserve its slot, `showReset` to reveal it). Buttons stay mounted so
 * the hex input width doesn't change as they appear.
 *
 * The wrapper div keeps the picker out of reach of Field's `*:w-auto`
 * child selector, which would override the width set on the input group.
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
  className,
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
  className?: string;
  "aria-labelledby"?: string;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <ColorPicker
        className={cn("w-56", className)}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelledBy}
        actions={
          <>
            {onReset ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-xs"
                      className={cn((!showReset || disabled) && "invisible")}
                      onClick={onReset}
                      aria-label={t("resetToDefault", {
                        defaultValue: "Reset to default",
                      })}
                    >
                      <RotateCcwIcon />
                    </InputGroupButton>
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
                  <InputGroupButton
                    size="icon-xs"
                    className={cn((!isDirty || disabled) && "invisible")}
                    onClick={onSave}
                    loading={isSaving}
                    aria-label={t("save", { defaultValue: "Save" })}
                  >
                    <CheckIcon />
                  </InputGroupButton>
                }
              />
              <TooltipContent>
                <Trans i18nKey="save" defaults="Save" />
              </TooltipContent>
            </Tooltip>
          </>
        }
      />
    </div>
  );
}
