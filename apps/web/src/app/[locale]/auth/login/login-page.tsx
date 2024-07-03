"use client";
import { Button } from "@rallly/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

type PageProps = { magicLink: string; email: string };

export const LoginPage = ({ magicLink, email }: PageProps) => {
  const session = useSession();
  const posthog = usePostHog();
  const trpcUtils = trpc.useUtils();
  const magicLinkFetch = useMutation({
    mutationFn: async () => {
      const res = await fetch(magicLink);
      return res;
    },
    onSuccess: async (data) => {
      if (!data.url.includes("auth/error")) {
        // if login was successful, update the session
        const updatedSession = await session.update();
        if (updatedSession) {
          // identify the user in posthog
          posthog?.identify(updatedSession.user.id);

          await trpcUtils.invalidate();
        }
      }

      router.push(data.url);
    },
  });
  const { data } = trpc.user.getByEmail.useQuery({ email });
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="mb-6">
        <Logo />
      </div>

      <div className="shadow-huge rounded-md bg-white p-4">
        <div className="w-48 text-center">
          <div className="mb-4 font-semibold">
            <Trans i18nKey="continueAs" defaults="Continue as" />
          </div>
          <div className="text-center">
            <UserAvatar size="lg" name={data?.name} />
            <div className="py-4 text-center">
              <div className="mb-1 h-6 font-medium">
                {data?.name ?? <Skeleton className="inline-block h-5 w-16" />}
              </div>
              <div className="text-muted-foreground h-5 truncate text-sm">
                {data?.email ?? (
                  <Skeleton className="inline-block h-full w-20" />
                )}
              </div>
            </div>
          </div>
          <Button
            loading={magicLinkFetch.isLoading}
            onClick={async () => {
              await magicLinkFetch.mutateAsync();
            }}
            size="lg"
            variant="primary"
            className="mt-4 w-full"
          >
            <Trans i18nKey="continue" />
          </Button>
        </div>
      </div>
    </div>
  );
};
