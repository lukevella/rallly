"use client";
import { usePostHog } from "@rallly/posthog/client";
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
import { signOut } from "@/lib/auth-client";
import { trpc } from "../client";
import type { AppRouter } from "../routers";

function isTRPCClientError(error: Error): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

export function TRPCProvider(props: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const { t } = useTranslation();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 1000 * 60,
          },
        },
        queryCache: new QueryCache({
          onError(error) {
            if (isTRPCClientError(error)) {
              if (error.data?.code === "UNAUTHORIZED") {
                window.location.href = "/login";
              }
              if (error.data?.appError === "SETUP_REQUIRED") {
                window.location.href = "/setup";
              }
            }
          },
        }),
        mutationCache: new MutationCache({
          onError(error) {
            if (isTRPCClientError(error)) {
              posthog.capture("failed api request", {
                path: error.data?.path,
                code: error.data?.code,
                message: error.message,
              });
              switch (error.data?.code) {
                case "UNAUTHORIZED":
                  window.location.href = "/login";
                  break;
                case "TOO_MANY_REQUESTS":
                  toast.error(
                    t("tooManyRequests", {
                      defaultValue: "Too many requests",
                    }),
                    {
                      description: t("tooManyRequestsDescription", {
                        defaultValue: "Please try again later.",
                      }),
                    },
                  );
                  break;
                case "FORBIDDEN":
                  signOut().then(() => {
                    posthog?.reset();
                  });
                  break;
                default:
                  console.error(error);
                  break;
              }
            }
          },
        }),
      }),
  );
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
