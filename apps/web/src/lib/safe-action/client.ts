"use client";
import { toast } from "@rallly/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { unstable_rethrow } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { useTranslation } from "@/i18n/client";
import type { AppErrorCode } from "@/lib/errors/app-error";

type Callbacks = {
  onSuccess?: (args: { data: unknown; input: unknown }) => unknown;
  onError?: (args: { error: unknown; input: unknown }) => unknown;
  onSettled?: (args: { result: unknown; input: unknown }) => unknown;
};

function runCallback(callback: () => unknown) {
  Promise.resolve()
    .then(callback)
    .catch((error) => console.error(error));
}

/**
 * An action whose write changes the page calls refresh() or revalidatePath
 * on the server; the re-rendered page comes back in the action response.
 *
 * That re-render can unmount the component that ran the action (a deleted
 * row, a closed dialog) before next-safe-action's effect-driven callbacks
 * fire, so onSuccess, onError and onSettled run from the action's promise
 * instead.
 */
export const useSafeAction: typeof useAction = (action, options) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const callbacksRef = React.useRef(options);
  const showServerErrorToastRef = React.useRef(showServerErrorToast);
  React.useEffect(() => {
    callbacksRef.current = options;
    showServerErrorToastRef.current = showServerErrorToast;
  });

  const run = React.useCallback(
    async (input: unknown) => {
      const callbacks = callbacksRef.current as Callbacks | undefined;
      let result: Awaited<ReturnType<typeof action>>;
      try {
        result = await action(input as Parameters<typeof action>[0]);
      } catch (error) {
        // Redirects and notFound() are navigation, not failures
        unstable_rethrow(error);
        runCallback(() =>
          callbacks?.onError?.({ error: { thrownError: error }, input }),
        );
        runCallback(() => callbacks?.onSettled?.({ result: {}, input }));
        throw error;
      }

      if (result?.serverError || result?.validationErrors) {
        showServerErrorToastRef.current(result.serverError);
        runCallback(() => callbacks?.onError?.({ error: result, input }));
      } else {
        // Same blanket invalidation the tRPC mutation override does, so a
        // client query never shows stale data after a write.
        void queryClient.invalidateQueries();
        runCallback(() =>
          callbacks?.onSuccess?.({ data: result?.data, input }),
        );
      }
      runCallback(() => callbacks?.onSettled?.({ result, input }));

      return result;
    },
    [action, queryClient],
  );

  function showServerErrorToast(serverError: unknown) {
    if (serverError) {
      let translatedDescription = "An unexpected error occurred";

      switch (serverError as AppErrorCode) {
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
  }

  return useAction(run as typeof action, {
    initResult: options?.initResult,
    throwOnNavigation: options?.throwOnNavigation,
    onExecute: options?.onExecute,
  });
};
