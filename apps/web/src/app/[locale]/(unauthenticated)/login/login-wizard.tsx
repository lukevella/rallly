/**
 * This component is a wrapper around the LoginWizard component that is used to
 * handle the Next.js and NextAuth specific logic for the login flow.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React from "react";

import { AuthErrors } from "@/app/[locale]/(unauthenticated)/login/auth-errors";
import { LoginWizardError } from "@/app/[locale]/(unauthenticated)/login/login-wizard/errors";
import { LoginWizard } from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-wizard";
import { useOAuthProviders } from "@/app/[locale]/(unauthenticated)/login/oauth-providers";
import { useTranslation } from "@/app/i18n/client";
import { Spinner } from "@/components/spinner";
import { useDayjs } from "@/utils/dayjs";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

export function NextLoginWizard() {
  const router = useRouter();
  const { data: oAuthProviders } = useOAuthProviders();
  const searchParams = useSearchParams();
  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  const session = useSession();
  const { timeZone } = useDayjs();
  const { i18n } = useTranslation();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";
  const getUserExists = trpc.auth.getUserInfo.useMutation();

  const initiateSignUp = trpc.auth.requestRegistration.useMutation();
  const finishSignUp = trpc.auth.authenticateRegistration.useMutation();

  // TODO (Luke Vella) [2024-06-27]: We should avoid using state for this
  // Keep the token in a session cookie instead
  const [token, setToken] = React.useState<string>();

  if (!oAuthProviders) {
    return <Spinner />;
  }

  return (
    <div>
      <LoginWizard
        checkUserExists={async (email) => {
          // check whether user exists
          const res = await getUserExists.mutateAsync({ email });

          if (res.isRegistered) {
            await signIn("email", {
              redirect: false,
              email,
              callbackUrl,
            });
            return true;
          }
          return false;
        }}
        providers={oAuthProviders}
        initiateSignUp={async (data) => {
          const res = await initiateSignUp.mutateAsync(data);
          if (res.ok) {
            setToken(res.token);
          } else {
            throw new LoginWizardError(res.reason);
          }
        }}
        finishSignUp={async ({ otp }) => {
          if (!token) {
            throw new LoginWizardError("invalidOTP");
          }

          const locale = i18n.language;

          const res = await finishSignUp.mutateAsync({
            code: otp,
            timeZone,
            locale,
            token,
          });

          if (!res.user) {
            throw new Error("Failed to authenticate user");
          }

          queryClient.invalidate();

          posthog?.identify(res.user.id, {
            email: res.user.email,
            name: res.user.name,
            timeZone,
            locale,
          });

          posthog?.capture("register");

          signIn("registration-token", {
            token,
            callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
          });
        }}
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
