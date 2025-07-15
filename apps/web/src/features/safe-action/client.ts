"use client";
import { toast } from "@rallly/ui/sonner";
import { useAction } from "next-safe-action/hooks";
import { useTranslation } from "@/i18n/client";

export const useSafeAction: typeof useAction = (action, options) => {
  const { t } = useTranslation();
  return useAction(action, {
    ...options,
    onError: ({ error }) => {
      if (error.serverError) {
        let translatedDescription = "An unexpected error occurred";

        switch (error.serverError) {
          case "UNAUTHORIZED":
            translatedDescription = t("actionErrorUnauthorized", {
              defaultValue: "You are not authorized to perform this action",
            });
            break;
          case "NOT_FOUND":
            translatedDescription = t("actionErrorNotFound", {
              defaultValue: "The resource was not found",
            });
            break;
          case "FORBIDDEN":
            translatedDescription = t("actionErrorForbidden", {
              defaultValue: "You are not allowed to perform this action",
            });
            break;
          case "INTERNAL_SERVER_ERROR":
            translatedDescription = t("actionErrorInternalServerError", {
              defaultValue: "An internal server error occurred",
            });
            break;
        }

        toast.error(translatedDescription);
      }
    },
  });
};
