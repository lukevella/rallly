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

const links = [
  {
    name: "Home",
    href: "/",
    description: "Go back to your dashboard.",
    icon: HomeIcon,
  },
  {
    name: "Create a Poll",
    href: "/new",
    description: "Start scheduling a new meeting.",
    icon: PlusIcon,
  },
  {
    name: "Support",
    href: "https://support.rallly.co",
    description: "Browse our help articles and FAQs.",
    icon: LifeBuoyIcon,
  },
  {
    name: "GitHub",
    href: "https://github.com/lukevella/rallly",
    description: "Report an issue or check for updates.",
    icon: GithubIcon,
  },
];

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
          <p className="font-semibold text-base/8 text-primary">Error</p>
          <h1 className="mt-4 text-balance font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
            Something went wrong
          </h1>
          <p className="mt-6 text-pretty font-medium text-lg text-muted-foreground sm:text-xl/8">
            An unexpected error occurred. Please try again or visit one of the
            pages below.
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-lg sm:mt-20">
          <ul className="-mt-6 divide-y divide-border border-border border-b">
            {links.map((link) => (
              <li key={link.name} className="relative flex gap-x-6 py-6">
                <div className="flex size-10 flex-none items-center justify-center rounded-lg border border-border bg-card">
                  <link.icon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </div>
                <div className="flex-auto">
                  <h3 className="font-semibold text-foreground text-sm">
                    <Link href={link.href}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {link.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm/6">
                    {link.description}
                  </p>
                </div>
                <div className="flex-none self-center">
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Button variant="primary" onClick={() => reset()}>
              Try again
            </Button>
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
