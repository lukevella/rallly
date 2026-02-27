"use client";
import { toast } from "@rallly/ui/sonner";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "../client";
import type { AppRouter } from "../routers";

function isTRPCClientError(error: Error): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

export function TRPCProvider(props: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [queryClient] = useState(() => {
    function handleError(error: Error) {
      if (!isTRPCClientError(error)) {
        return;
      }

      switch (error.data?.code) {
        case "UNAUTHORIZED":
          authClient.signOut().finally(() => {
            window.location.href = "/login";
          });
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

    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 1000 * 60,
        },
      },
      queryCache: new QueryCache({ onError: handleError }),
      mutationCache: new MutationCache({ onError: handleError }),
    });
  });
  const [trpcClient] = useState(() =>
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
