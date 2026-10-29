"use client";

import { Button } from "@rallly/ui/button";
import type { Color } from "@rallly/ui/color-picker";
import { ColorPicker } from "@rallly/ui/color-picker";
import type React from "react";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Color swatch that opens a picker popover, with save and optional
 * reset-to-default actions beside it. Save shows while `isDirty`; reset
 * shows when `onReset` is passed and `showReset` is true. `saveBadge`
 * renders inside the save button, e.g. a plan badge.
 *
 * The wrapper fieldset matters: react-aria's ColorPicker renders no element of
 * its own, so without it the swatch trigger would be a direct child of
 * Field, whose `*:w-auto` child selector collapses the button's width.
 */
export function ColorPickerWithSaveButton({
  value,
  onChange,
  isDirty,
  isSaving,
  onSave,
  saveBadge,
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
  saveBadge?: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  const { t } = useTranslation();

  return (
    // Named group so each row's save and reset buttons say which color
    // they act on when a page has more than one picker.
    <fieldset aria-labelledby={labelledBy} className="flex items-center gap-2">
      {onReset && showReset ? (
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={disabled || isSaving}
        >
          <Trans i18nKey="reset" defaults="Reset" />
        </Button>
      ) : null}
      {isDirty ? (
        <Button
          variant="default"
          onClick={onSave}
          loading={isSaving}
          disabled={disabled || isSaving}
        >
          <Trans i18nKey="save" defaults="Save" />
          {saveBadge}
        </Button>
      ) : null}
      <ColorPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelledBy}
        aria-label={t("chooseColor", { defaultValue: "Choose color" })}
        hexInputLabel={t("hexColor", { defaultValue: "Hex color" })}
      />
    </fieldset>
  );
}
