"use client";
import { isActionMutationError } from "@next-safe-action/adapter-tanstack-query";
import { toast } from "@rallly/ui/sonner";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { isNavigationError } from "next-safe-action";
import React from "react";
import superjson from "superjson";
import { useTranslation } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import type { AppErrorCode } from "@/lib/errors/app-error";
import { registerBrowserQueryClient } from "@/lib/query-client";
import { trpc } from "../client";
import type { AppRouter } from "../routers";

function isTRPCClientError(error: Error): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

// A request cancelled on unmount or navigation surfaces as an aborted tRPC
// request with no server response. Nothing broke, so it must not raise a
// "Unable to reach the server" toast.
function isAbortError(error: TRPCClientError<AppRouter>) {
  return (
    error.cause instanceof DOMException && error.cause.name === "AbortError"
  );
}

export function TRPCProvider(props: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [queryClient] = React.useState(() => {
    function showNetworkErrorToast() {
      toast.error(
        t("actionErrorNetwork", {
          defaultValue:
            "Unable to reach the server. Please check your connection and try again.",
        }),
        { id: "network-error" },
      );
    }

    // One table for both transports: tRPC error codes and the codes
    // handleServerError returns for server actions share their names.
    function showErrorToast(code: string | undefined) {
      switch (code as AppErrorCode | undefined) {
        case "INVALID_SESSION":
          // Never sign out automatically — a failed sign out turns this
          // into an infinite loop with the login page.
          toast.error(
            t("actionErrorInvalidSession", {
              defaultValue: "Your session is no longer valid",
            }),
            {
              id: "invalid-session",
              duration: Number.POSITIVE_INFINITY,
              action: {
                label: t("signOut", { defaultValue: "Sign out" }),
                onClick: () => {
                  signOut().finally(() => {
                    window.location.href = "/login";
                  });
                },
              },
            },
          );
          break;
        // Finalizing a poll mints the meeting link first; these carry their
        // own remedy and must not be reported as a generic server error.
        case "CONFERENCING_NOT_CONNECTED":
          toast.error(
            t("actionErrorConferencingNotConnected", {
              defaultValue:
                "Your video call account is not connected. Connect it in Settings → Conferencing and try again.",
            }),
          );
          break;
        case "CONFERENCING_FAILED":
          toast.error(
            t("actionErrorConferencingFailed", {
              defaultValue:
                "We couldn't create the meeting link. Check your account in Settings → Conferencing and try again.",
            }),
          );
          break;
        case "UNAUTHORIZED":
          toast.error(
            t("actionErrorUnauthorized", {
              defaultValue: "You are not authorized to perform this action",
            }),
            { id: "unauthorized" },
          );
          break;
        case "FORBIDDEN":
          toast.error(
            t("actionErrorForbidden", {
              defaultValue: "You are not allowed to perform this action",
            }),
          );
          break;
        case "NOT_FOUND":
          toast.error(
            t("actionErrorNotFound", {
              defaultValue: "The resource was not found",
            }),
          );
          break;
        case "TOO_MANY_REQUESTS":
          toast.error(
            t("actionErrorTooManyRequests", {
              defaultValue: "You are making too many requests",
            }),
          );
          break;
        case "PAYLOAD_TOO_LARGE":
          toast.error(
            t("actionErrorPayloadTooLarge", {
              defaultValue:
                "The file you uploaded is too large. Please try a smaller file.",
            }),
          );
          break;
        case "PAYMENT_REQUIRED":
          toast.error(
            t("actionErrorPaymentRequired", {
              defaultValue: "You need to upgrade to perform this action",
            }),
          );
          break;
        case "SERVICE_UNAVAILABLE":
          toast.error(
            t("actionErrorServiceUnavailable", {
              defaultValue:
                "The service required to perform this action is not available",
            }),
          );
          break;
        default:
          toast.error(
            t("actionErrorInternalServerError", {
              defaultValue: "An internal server error occurred",
            }),
          );
          break;
      }
    }

    function handleTRPCError(error: TRPCClientError<AppRouter>) {
      // A cancelled request is not a failure — never warn about connectivity
      if (isAbortError(error)) {
        return;
      }

      // Missing error data means no usable server response: the request
      // failed in transit or the response was not a tRPC error envelope
      // (e.g. an HTML error page from a proxy)
      if (!error.data) {
        showNetworkErrorToast();
        return;
      }

      showErrorToast(
        error.data.appError === "INVALID_SESSION" ||
          error.data.appError === "CONFERENCING_NOT_CONNECTED" ||
          error.data.appError === "CONFERENCING_FAILED"
          ? error.data.appError
          : error.data.code,
      );
    }

    function handleQueryError(error: Error) {
      if (isTRPCClientError(error)) {
        handleTRPCError(error);
      }
    }

    function handleMutationError(error: Error) {
      if (isTRPCClientError(error)) {
        handleTRPCError(error);
        return;
      }

      if (isActionMutationError(error)) {
        // Validation errors belong to the form that sent the input
        if (typeof error.serverError === "string") {
          showErrorToast(error.serverError);
        }
        return;
      }

      // Redirects and notFound() are rethrown for Next.js to handle
      if (isNavigationError(error)) {
        return;
      }

      // A server action that throws instead of returning a result never
      // got a usable response: the request failed in transit
      showNetworkErrorToast();
    }

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 1000 * 60,
        },
      },
      queryCache: new QueryCache({ onError: handleQueryError }),
      mutationCache: new MutationCache({
        onError: handleMutationError,
        onSuccess: () => {
          // Blanket invalidation after every write, so a client query never
          // shows stale data
          void client.invalidateQueries();
        },
      }),
    });
    // Sign-out refreshes the router but keeps this provider mounted, so
    // signOut() clears the cache through this registration.
    registerBrowserQueryClient(client);
    return client;
  });
  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: absoluteUrl("/api/trpc"),
          transformer: superjson,
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
