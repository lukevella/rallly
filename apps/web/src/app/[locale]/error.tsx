"use client";

import { Button } from "@rallly/ui/button";
import * as Sentry from "@sentry/nextjs";
import {
  ChevronRightIcon,
  GithubIcon,
  HomeIcon,
  LifeBuoyIcon,
  PlusIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Trans } from "@/i18n/client";

function ErrorLinkItem({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-x-6 py-6">
      <div className="flex size-10 flex-none items-center justify-center rounded-lg border border-border bg-card">
        {icon}
      </div>
      <div className="flex-auto">
        <h3 className="font-semibold text-foreground text-sm">
          <Link href={href}>
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-muted-foreground text-sm/6">{description}</p>
      </div>
      <div className="flex-none self-center">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </div>
    </li>
  );
}

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
    <div className="bg-background">
      <main className="mx-auto w-full max-w-7xl px-6 pt-10 pb-16 sm:pb-24 lg:px-8">
        <Image
          src="/static/logo.svg"
          alt="Rallly"
          width={130}
          height={30}
          className="mx-auto dark:hidden"
        />
        <Image
          src="/static/logo-dark.svg"
          alt="Rallly"
          width={130}
          height={30}
          className="mx-auto hidden dark:block"
        />
        <div className="mx-auto mt-20 max-w-2xl text-center sm:mt-24">
          <p className="font-semibold text-base/8 text-primary">
            <Trans i18nKey="errorLabel" defaults="Error" />
          </p>
          <h1 className="mt-4 text-balance font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
            <Trans i18nKey="errorTitle" defaults="Something went wrong" />
          </h1>
          <p className="mt-6 text-pretty font-medium text-lg text-muted-foreground sm:text-xl/8">
            <Trans
              i18nKey="errorDescription"
              defaults="An unexpected error occurred. Please try again or visit one of the pages below."
            />
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-lg sm:mt-20">
          <ul className="-mt-6 divide-y divide-border border-border border-b">
            <ErrorLinkItem
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
            <ErrorLinkItem
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
            <ErrorLinkItem
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
            <ErrorLinkItem
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
          </ul>
          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Button variant="primary" onClick={() => reset()}>
              <Trans i18nKey="errorTryAgain" defaults="Try again" />
            </Button>
            <Button asChild>
              <Link href="/">
                <Trans i18nKey="errorBackToHome" defaults="Back to home" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
