"use client";

import { toast } from "@rallly/ui/sonner";
import { useTranslation } from "@/i18n/client";

export function useToastProgress() {
  const { t } = useTranslation();
  return <T>(promise: Promise<T>) =>
    toast.promise(promise, {
      loading: t("saving", { defaultValue: "Saving..." }),
      success: t("saved", { defaultValue: "Saved" }),
      error: t("unexpectedError", { defaultValue: "Unexpected Error" }),
    });
}
