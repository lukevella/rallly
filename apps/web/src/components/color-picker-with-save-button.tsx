"use client";

import { Button } from "@rallly/ui/button";
import type { Color } from "@rallly/ui/color-picker";
import { ColorPicker } from "@rallly/ui/color-picker";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Color swatch that opens a picker popover with save and optional
 * reset-to-default actions in its footer (pass `onReset` to show the
 * reset button; `showReset` enables it).
 *
 * The wrapper div matters: react-aria's ColorPicker renders no element of
 * its own, so without it the swatch trigger would be a direct child of
 * Field, whose `*:w-auto` child selector collapses the button's width.
 */
export function ColorPickerWithSaveButton({
  value,
  onChange,
  isSaving,
  onSave,
  onReset,
  showReset = false,
  disabled = false,
  "aria-labelledby": labelledBy,
}: {
  value: Color;
  onChange: (color: Color) => void;
  isSaving: boolean;
  onSave: () => void;
  onReset?: () => void;
  showReset?: boolean;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <ColorPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelledBy}
        aria-label={t("chooseColor", { defaultValue: "Choose color" })}
        hexInputLabel={t("hexColor", { defaultValue: "Hex color" })}
        footer={
          <div className="flex justify-end gap-2">
            {onReset ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onReset}
                disabled={!showReset || disabled || isSaving}
              >
                <Trans i18nKey="reset" defaults="Reset" />
              </Button>
            ) : null}
            {/* Not gated on isDirty: the hex field only commits on blur, so a
              typed color hasn't reached `value` yet when the user clicks —
              the click's mousedown commits it, then the handler saves. */}
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={onSave}
              loading={isSaving}
              disabled={disabled || isSaving}
            >
              <Trans i18nKey="save" defaults="Save" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
