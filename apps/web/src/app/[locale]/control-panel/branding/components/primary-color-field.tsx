"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { parseColor } from "@rallly/ui/color-picker";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { ColorPickerWithSaveButton } from "@/components/color-picker-with-save-button";
import { useTranslation } from "@/i18n/client";
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
  const updateBranding = useMutation(
    mutationOptions(updateBrandingSettingsAction, {
      onSuccess: () => {
        toast.success(t("saved", { defaultValue: "Saved" }));
      },
    }),
  );
  const [color, setColor] = React.useState(() => parseColor(defaultValue));
  const hexColor = color.toString("hex");

  const handleSave = () => {
    updateBranding.mutate(
      field === "primaryColor"
        ? { primaryColor: hexColor }
        : { primaryColorDark: hexColor },
    );
  };

  return (
    <ColorPickerWithSaveButton
      value={color}
      onChange={setColor}
      disabled={disabled}
      isSaving={updateBranding.isPending}
      onSave={handleSave}
      aria-labelledby={labelledBy}
    />
  );
}
