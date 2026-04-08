"use client";

import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { useBilling } from "@/features/billing/client";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function CustomBrandingSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const { isFree, showPayWall } = useBilling();
  const updateShowBranding = trpc.spaces.updateShowBranding.useMutation();
  const utils = trpc.useUtils();

  const handleToggle = (checked: boolean) => {
    if (isFree) {
      showPayWall();
      return;
    }
    toast.promise(
      updateShowBranding
        .mutateAsync({ showBranding: checked })
        .then(() => utils.spaces.getCurrent.invalidate()),
      {
        loading: t("savingBranding", { defaultValue: "Saving..." }),
        success: checked
          ? t("brandingEnabled", { defaultValue: "Custom branding enabled" })
          : t("brandingDisabled", { defaultValue: "Custom branding disabled" }),
        error: t("brandingSaveError", {
          defaultValue: "Failed to save branding",
        }),
      },
    );
    onChange?.(checked);
  };

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={updateShowBranding.isPending}
    />
  );
}
