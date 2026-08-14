"use client";

import { parseColor } from "@rallly/ui/color-picker";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { ColorPickerWithSaveButton } from "@/components/color-picker-with-save-button";
import { useTranslation } from "@/i18n/client";
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
    <ColorPickerWithSaveButton
      value={color}
      onChange={setColor}
      disabled={disabled}
      isDirty={isDirty}
      isSaving={updateBranding.isExecuting}
      onSave={handleSave}
      aria-labelledby={labelledBy}
    />
  );
}
