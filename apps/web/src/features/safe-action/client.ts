"use client";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useTranslation } from "@/i18n/client";

export const useSafeAction: typeof useAction = (action, options) => {
  const { t } = useTranslation();
  const router = useRouter();
  return useAction(action, {
    ...options,
    onSuccess: (args) => {
      router.refresh();
      options?.onSuccess?.(args);
    },
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
          case "TOO_MANY_REQUESTS":
            translatedDescription = t("actionErrorTooManyRequests", {
              defaultValue: "You are making too many requests",
            });
            break;
        }

        toast.error(translatedDescription);
      }
    },
  });
};
