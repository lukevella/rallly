"use client";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

import { Logo } from "@/components/logo";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";

export const LoginPage = ({ email, code }: { email: string; code: string }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setLoading] = React.useState(false);

  const { data } = trpc.user.getByEmail.useQuery({ email });
  const router = useRouter();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="mb-12">
        <Logo className="mx-auto" />
      </div>
      <div className="w-48 space-y-8 text-center">
        <h1 className="font-bold text-xl">
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
            <div className="h-5 truncate text-muted-foreground text-sm">
              {data?.email ?? <Skeleton className="inline-block h-full w-20" />}
            </div>
          </div>
        </div>
        <div>
          <Button
            size="lg"
            loading={isLoading}
            onClick={async () => {
              setLoading(true);
              setError(null);

              try {
                const res = await authClient.signIn.emailOtp({
                  email,
                  otp: code,
                });
                if (res.error) {
                  setError(res.error.message ?? "An error occurred");
                } else {
                  router.push("/");
                }
              } finally {
                setLoading(false);
              }
            }}
            variant="primary"
            className="w-full"
          >
            <Trans i18nKey="login" defaults="Login" />
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
};
