import * as z from "zod";
import { usePasswordValidationSchema } from "@/features/password/schema";
import { useTranslation } from "@/i18n/client";
import { isValidName } from "@/utils/is-valid-name";

export const useRegisterNameFormSchema = () => {
  const { t } = useTranslation();
  const passwordValidation = usePasswordValidationSchema();
  return z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(
        isValidName,
        t("invalidName", {
          defaultValue:
            "Please enter a valid name, not a URL, email, or phone number",
        }),
      ),
    email: z.email(
      t("invalidEmail", {
        defaultValue: "Please enter a valid email address",
      }),
    ),
    password: passwordValidation,
  });
};
