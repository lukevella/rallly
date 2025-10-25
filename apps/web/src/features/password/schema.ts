"use client";
import { z } from "zod";
import {
  calculatePasswordStrength,
  passwordQualityThresholds,
} from "@/features/password/utils";
import { useTranslation } from "@/i18n/client";

export function usePasswordValidationSchema() {
  const { t } = useTranslation();
  return z.string().refine(
    (password) =>
      calculatePasswordStrength(password) >= passwordQualityThresholds.good,
    t("passwordTooWeak", {
      defaultValue: "Password is too weak. Please use a stronger password.",
    }),
  );
}
