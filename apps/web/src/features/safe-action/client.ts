"use client";
import { useTranslation } from "@/i18n/client";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

export const useSafeAction: typeof useAction = (action, options) => {
  const { t } = useTranslation();
  return useAction(action, {
    ...options,
    onError: ({ error }) => {
      if (error.serverError) {
        let translatedDescription = "An unexpected error occurred";

        switch (error.serverError) {
          case "UNAUTHORIZED":
            translatedDescription = t("safeActionUnauthorized", {
              defaultValue: "You are not authorized to perform this action",
            });
            break;
          case "NOT_FOUND":
            translatedDescription = t("safeActionNotFound", {
              defaultValue: "The resource was not found",
            });
            break;
          case "FORBIDDEN":
            translatedDescription = t("safeActionForbidden", {
              defaultValue: "You are not allowed to perform this action",
            });
            break;
          case "INTERNAL_SERVER_ERROR":
            translatedDescription = t("safeActionInternalServerError", {
              defaultValue: "An internal server error occurred",
            });
            break;
        }

        toast(
          t("error", {
            defaultValue: "Error",
          }),
          {
            description: translatedDescription,
          },
        );
      }
    },
  });
};
