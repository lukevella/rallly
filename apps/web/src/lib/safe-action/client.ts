"use client";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useTranslation } from "@/i18n/client";
import type { AppErrorCode } from "@/lib/errors";

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

        switch (error.serverError as AppErrorCode) {
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
          case "PAYMENT_REQUIRED":
            translatedDescription = t("actionErrorPaymentRequired", {
              defaultValue: "You need to upgrade to perform this action",
            });
            break;
          case "SERVICE_UNAVAILABLE":
            translatedDescription = t("actionErrorServiceUnavailable", {
              defaultValue:
                "The service required to perform this action is not available",
            });
            break;
          case "PAYLOAD_TOO_LARGE":
            translatedDescription = t("actionErrorPayloadTooLarge", {
              defaultValue:
                "The file you uploaded is too large. Please try a smaller file.",
            });
            break;
        }

        toast.error(translatedDescription);
      }
    },
  });
};
