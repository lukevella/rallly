"use client";
import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { trpc } from "@/trpc/client";

type PageProps = { magicLink: string; email: string };

export const LoginPage = ({ magicLink, email }: PageProps) => {
  const session = useSession();
  const posthog = usePostHog();
  const magicLinkFetch = useMutation({
    mutationFn: async () => {
      const res = await fetch(magicLink);
      return res;
    },
    onSuccess: async (data) => {
      if (!data.url.includes("auth/error")) {
        // if login was successful, update the session
        const updatedSession = await session.update();
        if (updatedSession?.user) {
          // identify the user in posthog
          posthog?.identify(updatedSession.user.id, {
            email: updatedSession.user.email,
            name: updatedSession.user.name,
          });
        }
      }

      router.push(data.url);
    },
  });
  const { data } = trpc.user.getByEmail.useQuery({ email });
  const router = useRouter();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-48 space-y-8 text-center">
        <h1 className="text-xl font-bold">
          <Trans i18nKey="continueAs" defaults="Continue as" />
        </h1>
        <div className="flex flex-col items-center gap-4">
          <OptimizedAvatarImage
            src={data?.image ?? undefined}
            name={data?.name ?? ""}
            size="xl"
          />
          <div>
            <div className="mb-1 h-6 font-medium">
              {data?.name ?? <Skeleton className="inline-block h-5 w-16" />}
            </div>
            <div className="text-muted-foreground h-5 truncate text-sm">
              {data?.email ?? <Skeleton className="inline-block h-full w-20" />}
            </div>
          </div>
        </div>
        <div>
          <Button
            size="lg"
            loading={magicLinkFetch.isLoading}
            onClick={async () => {
              await magicLinkFetch.mutateAsync();
            }}
            variant="primary"
            className="w-full"
          >
            <Trans i18nKey="login" defaults="Login" />
          </Button>
        </div>
      </div>
    </div>
  );
};
