"use client";

import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { InputGroupButton } from "@rallly/ui/input-group";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon } from "lucide-react";
import React from "react";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { updateBrandingSettingsAction } from "../actions";

export function PrimaryColorField({
  field,
  defaultValue,
  disabled = false,
  "aria-labelledby": labelledBy,
}: {
  field: "primaryColor" | "primaryColorDark";
  defaultValue: string;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  const { t } = useTranslation();
  const updateBranding = useSafeAction(updateBrandingSettingsAction);
  const [color, setColor] = React.useState(() => parseColor(defaultValue));
  const hexColor = color.toString("hex");
  // Stored values may differ in case from what the picker emits
  const isDirty = hexColor.toLowerCase() !== defaultValue.toLowerCase();

  if (disabled) {
    // The color picker has no disabled state; show a static swatch instead
    return (
      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded border"
          style={{ backgroundColor: defaultValue }}
        />
        <span className="font-mono text-sm">{defaultValue}</span>
      </div>
    );
  }

  const handleSave = async () => {
    const result = await updateBranding.executeAsync(
      field === "primaryColor"
        ? { primaryColor: hexColor }
        : { primaryColorDark: hexColor },
    );

    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t("saved", { defaultValue: "Saved" }));
    }
  };

  return (
    <ColorPicker
      className="w-44"
      value={color}
      onChange={setColor}
      aria-labelledby={labelledBy}
      actions={
        isDirty ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton
                  size="icon-xs"
                  onClick={handleSave}
                  loading={updateBranding.isExecuting}
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
        ) : null
      }
    />
  );
}
