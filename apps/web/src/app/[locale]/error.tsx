"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import * as Sentry from "@sentry/nextjs";
import { GithubIcon, HomeIcon, LifeBuoyIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { ErrorPage, ErrorPageLinkItem } from "@/components/error-page";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { INVALID_SESSION } from "@/lib/errors/invalid-session-error";

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const isInvalidSession = error.digest === INVALID_SESSION;

  React.useEffect(() => {
    if (!isInvalidSession) {
      Sentry.captureException(error);
    }
  }, [error, isInvalidSession]);

  if (isInvalidSession) {
    // Never sign out automatically — a failed sign out turns this into an
    // infinite loop with the login page.
    return (
      <ErrorPage
        label={<Trans i18nKey="invalidSessionLabel" defaults="Session" />}
        title={
          <Trans
            i18nKey="invalidSessionTitle"
            defaults="Your session is no longer valid"
          />
        }
        description={
          <Trans
            i18nKey="invalidSessionDescription"
            defaults="Sign out and log in again to continue."
          />
        }
        actions={
          <Button
            variant="primary"
            loading={isSigningOut}
            onClick={() => {
              setIsSigningOut(true);
              signOut().finally(() => {
                router.push("/login");
              });
            }}
          >
            <Trans i18nKey="signOut" defaults="Sign Out" />
          </Button>
        }
      >
        {null}
      </ErrorPage>
    );
  }

  return (
    <ErrorPage
      label={<Trans i18nKey="errorLabel" defaults="Error" />}
      title={<Trans i18nKey="errorTitle" defaults="Something went wrong" />}
      description={
        <Trans
          i18nKey="errorDescription"
          defaults="An unexpected error occurred. Please try again or visit one of the pages below."
        />
      }
      actions={
        <>
          <Button variant="primary" onClick={() => reset()}>
            <Trans i18nKey="errorTryAgain" defaults="Try again" />
          </Button>
          <Link href="/" className={buttonVariants()}>
            <Trans i18nKey="errorBackToHome" defaults="Back to home" />
          </Link>
        </>
      }
    >
      <ErrorPageLinkItem
        href="/"
        icon={<HomeIcon className="size-4 text-muted-foreground" />}
        title={<Trans i18nKey="errorLinkHome" defaults="Home" />}
        description={
          <Trans
            i18nKey="errorLinkHomeDescription"
            defaults="Go back to your dashboard."
          />
        }
      />
      <ErrorPageLinkItem
        href="/new"
        icon={<PlusIcon className="size-4 text-muted-foreground" />}
        title={<Trans i18nKey="errorLinkCreatePoll" defaults="Create a Poll" />}
        description={
          <Trans
            i18nKey="errorLinkCreatePollDescription"
            defaults="Start scheduling a new meeting."
          />
        }
      />
      <ErrorPageLinkItem
        href="https://support.rallly.co"
        icon={<LifeBuoyIcon className="size-4 text-muted-foreground" />}
        title={<Trans i18nKey="errorLinkSupport" defaults="Support" />}
        description={
          <Trans
            i18nKey="errorLinkSupportDescription"
            defaults="Browse our help articles and FAQs."
          />
        }
      />
      <ErrorPageLinkItem
        href="https://github.com/lukevella/rallly"
        icon={<GithubIcon className="size-4 text-muted-foreground" />}
        title={<Trans i18nKey="errorLinkGithub" defaults="GitHub" />}
        description={
          <Trans
            i18nKey="errorLinkGithubDescription"
            defaults="Report an issue or check for updates."
          />
        }
      />
    </ErrorPage>
  );
}
