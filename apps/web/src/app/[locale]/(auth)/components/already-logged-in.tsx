import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { validateRedirectUrl } from "@/lib/utils/redirect";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "./auth-page";
import { SignOutButton } from "./sign-out-button";

/**
 * Shown on /login instead of redirecting when a session already exists.
 * The redirect used to be automatic, which made /login one leg of the
 * / ↔ /login redirect loop (RAL-1313) — a loop needs two automated legs,
 * so the user must click to continue. The sign out button is the escape
 * hatch when the session only looks alive (stale cookie cache).
 *
 * Server component: AuthPageContainer renders the async server-only Logo,
 * so this must not be a client module.
 */
export async function AlreadyLoggedIn({ redirectTo }: { redirectTo?: string }) {
  const { t } = await getTranslation();

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="alreadyLoggedInTitle"
            defaults="You're already signed in"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="alreadyLoggedInDescription"
            defaults="Continue to your dashboard or sign out to use a different account."
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <div className="grid gap-3">
          <Link
            className={buttonVariants({ variant: "primary", size: "xl" })}
            href={validateRedirectUrl(redirectTo) ?? "/"}
          >
            <Trans
              t={t}
              ns="app"
              i18nKey="alreadyLoggedInContinue"
              defaults="Continue"
            />
          </Link>
          <SignOutButton />
        </div>
      </AuthPageContent>
    </AuthPageContainer>
  );
}
