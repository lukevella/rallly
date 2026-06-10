import { useTranslation } from "@/i18n/client";

/**
 * @deprecated Use form validation hook instead
 */
export const requiredString = (value: string) => !!value.trim();

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const useFormValidation = () => {
  const { t } = useTranslation();

  return {
    requiredString: (name?: string) => (value: string) => {
      if (!value || !value.trim()) {
        return t("requiredString", { name });
      }
    },

    validEmail: (value: string) => {
      if (!emailRegex.test(value)) {
        return t("validEmail");
      }
    },
  };
};
