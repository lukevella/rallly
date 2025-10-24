"use client";
import { z } from "zod";
import {
  calculatePasswordStrength,
  passwordQualityThresholds,
} from "@/features/password/utils";
import { useTranslation } from "@/i18n/client";

export const passwordValidationSchema = z
  .string()
  .refine(
    (password) =>
      calculatePasswordStrength(password) >= passwordQualityThresholds.good,
  );

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

export type PasswordQuality = "veryWeak" | "weak" | "fair" | "good" | "strong";
