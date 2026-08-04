import { buttonVariants } from "@rallly/ui";
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
import { SessionCookieCleanup } from "./session-cookie-cleanup";
import { SignOutButton } from "./sign-out-button";

/**
 * Shown on /login instead of redirecting when a session already exists.
 * The redirect used to be automatic, which made /login one leg of the
 * / ↔ /login redirect loop — a loop needs two automated legs,
 * so the user must click to continue. The sign out button is the escape
 * hatch when the session only looks alive (stale cookie cache).
 *
 * Server component: AuthPageContainer renders the async server-only Logo,
 * so this must not be a client module.
 */
export async function AlreadyLoggedIn({ redirectTo }: { redirectTo?: string }) {
  const { t, i18n } = await getTranslation();

  return (
    <AuthPageContainer>
      <SessionCookieCleanup />
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="alreadyLoggedInTitle"
            defaults="You're already signed in"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="alreadyLoggedInDescription"
            defaults="Continue to your dashboard or sign out to use a different account."
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <div className="grid gap-3">
          {/* Plain anchor, not <Link>: the router cache can hold a stale
              redirect for the destination (the / → /login bounce that
              brought the user here), which a soft navigation replays
              without consulting the server. A document navigation always
              sends the current cookies. */}
          <a
            className={buttonVariants({ variant: "primary", size: "xl" })}
            href={validateRedirectUrl(redirectTo) ?? "/"}
          >
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="alreadyLoggedInContinue"
              defaults="Continue"
            />
          </a>
          <SignOutButton />
        </div>
      </AuthPageContent>
    </AuthPageContainer>
  );
}
