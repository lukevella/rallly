import * as z from "zod";
import {
  calculatePasswordStrength,
  passwordQualityThresholds,
} from "@/features/auth/utils";
import { useTranslation } from "@/i18n/client";

const isStrongEnough = (password: string) =>
  calculatePasswordStrength(password) >= passwordQualityThresholds.good;

export const passwordSchema = z
  .string()
  .max(128)
  .refine(isStrongEnough, "Password is too weak");

export function usePasswordValidationSchema() {
  const { t } = useTranslation();
  return z
    .string()
    .max(128)
    .refine(
      isStrongEnough,
      t("passwordTooWeak", {
        defaultValue: "Password is too weak. Please use a stronger password.",
      }),
    );
}
