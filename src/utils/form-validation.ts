import { useTranslation } from "next-i18next";

/**
 * @deprecated Use form validation hook instead
 */
export const requiredString = (value: string) => !!value.trim();

/**
 * @deprecated Use form validation hook instead
 */
export const validEmail = (value: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

export const useFormValidation = () => {
  const { t } = useTranslation("app");

  return {
    requiredString: (name?: string) => (value: string) => {
      if (!value.trim()) {
        return t("requiredString", { name });
      }
    },

    validEmail: (value: string) => {
      const isValidEmail = validEmail(value);
      if (!isValidEmail) {
        return t("validEmail");
      }
    },
  };
};
