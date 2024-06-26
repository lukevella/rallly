/**
 * This component is a wrapper around the LoginWizard component that is used to
 * handle the Next.js and NextAuth specific logic for the login flow.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import { AuthErrors } from "@/app/[locale]/(unauthenticated)/login/auth-errors";
import { LoginWizard } from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-wizard";
import { useOAuthProviders } from "@/app/[locale]/(unauthenticated)/login/oauth-providers";
import { Spinner } from "@/components/spinner";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

export function NextLoginWizard() {
  const router = useRouter();
  const { data: oAuthProviders } = useOAuthProviders();
  const searchParams = useSearchParams();
  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  const session = useSession();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";
  const getUserExists = trpc.auth.getUserInfo.useMutation();

  if (!oAuthProviders) {
    return <Spinner />;
  }

  return (
    <div>
      <LoginWizard
        onLoginRequest={async (email) => {
          // check whether user exists
          const res = await getUserExists.mutateAsync({ email });

          if (res.isRegistered) {
            await signIn("email", {
              redirect: false,
              email,
              callbackUrl,
            });
          } else {
            return { error: "User not found" };
          }
        }}
        providers={oAuthProviders}
        onLogin={async (email, token) => {
          const url = `${
            window.location.origin
          }/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${token}`;

          const res = await fetch(url);

          const hasError = res.url.includes("auth/error");

          if (hasError) {
            return { error: "Invalid OTP" };
          } else {
            await queryClient.invalidate();
            const s = await session.update();

            if (s?.user) {
              posthog?.identify(s.user.id, {
                email: s.user.email,
                name: s.user.name,
              });
            }

            router.push(searchParams?.get("callbackUrl") ?? "/");
          }
        }}
        onContinueWithOAuth={async (providerId) => {
          const callbackUrl = searchParams?.get("callbackUrl");
          await signIn(providerId, {
            callbackUrl: callbackUrl ?? "/",
          });
        }}
      />
      <AuthErrors />
    </div>
  );
}
