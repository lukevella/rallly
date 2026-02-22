"use client";

import { Button } from "@rallly/ui/button";
import * as Sentry from "@sentry/nextjs";
import { GithubIcon, HomeIcon, LifeBuoyIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ErrorPage, ErrorPageLinkItem } from "@/components/error-page";
import { Trans } from "@/i18n/client";

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

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
          <Button asChild>
            <Link href="/">
              <Trans i18nKey="errorBackToHome" defaults="Back to home" />
            </Link>
          </Button>
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
        title={
          <Trans i18nKey="errorLinkCreatePoll" defaults="Create a Poll" />
        }
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
