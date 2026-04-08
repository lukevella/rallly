"use client";

import { Button } from "@rallly/ui/button";
import { ColorPicker, parseColor } from "@rallly/ui/color-picker";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import type { SpaceDTO } from "@/features/space/types";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function SpaceBrandingForm({ space }: { space: SpaceDTO }) {
  const { t } = useTranslation();
  const currentColor = space.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const [color, setColor] = React.useState(() => parseColor(currentColor));
  const hexColor = color.toString("hex");
  const isDirty = hexColor !== currentColor;

  const updateSpace = trpc.spaces.update.useMutation();
  const utils = trpc.useUtils();

  const handleSave = async () => {
    const value = hexColor === DEFAULT_PRIMARY_COLOR ? null : hexColor;
    toast.promise(
      updateSpace
        .mutateAsync({ name: space.name, primaryColor: value })
        .then(() => utils.spaces.getCurrent.invalidate()),
      {
        loading: t("savingBranding", { defaultValue: "Saving..." }),
        success: t("brandingSaved", { defaultValue: "Branding saved" }),
        error: t("brandingSaveError", {
          defaultValue: "Failed to save branding",
        }),
      },
    );
  };

  return (
    <div
      className={
        !space.showBranding ? "pointer-events-none opacity-50" : undefined
      }
    >
      <div className="w-56 space-y-4">
        <ColorPicker value={color} onChange={setColor} />
        <Button
          onClick={handleSave}
          disabled={!space.showBranding || !isDirty}
          loading={updateSpace.isPending}
        >
          <Trans i18nKey="save" defaults="Save" />
        </Button>
      </div>
    </div>
  );
}
