import "tailwindcss/tailwind.css";
import "../../style.css";

import languages from "@rallly/languages";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Analytics } from "@vercel/analytics/react";
import { MenuIcon } from "lucide-react";
import { domAnimation, LazyMotion } from "motion/react";
import type { Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { sans } from "@/fonts/sans";
import { I18nProvider } from "@/i18n/client/i18n-provider";
import { getTranslation } from "@/i18n/server";
import { linkToApp } from "@/lib/linkToApp";

import { Footer } from "./footer";
import { NavLink } from "./nav-link";

export async function generateStaticParams() {
  return Object.keys(languages).map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { t } = await getTranslation(locale, "common");
  return (
    <html lang={locale} className={sans.className}>
      <body>
        <LazyMotion features={domAnimation}>
          <I18nProvider locale={locale}>
            <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col space-y-12 p-4 sm:p-8">
              <header className="flex w-full items-center">
                <div className="flex grow items-center gap-x-12">
                  <Link className="inline-block rounded" href="/">
                    <Image
                      src="/logo.svg"
                      width={130}
                      height={30}
                      alt="rallly.co"
                    />
                  </Link>
                  <nav className="hidden items-center space-x-8 lg:flex">
                    <NavLink href="https://support.rallly.co/workflow/create">
                      <Trans
                        t={t}
                        i18nKey="howItWorks"
                        defaults="How it Works"
                      />
                    </NavLink>
                    <NavLink href="/pricing">
                      <Trans t={t} i18nKey="pricing" />
                    </NavLink>
                    <NavLink href="/blog">
                      <Trans t={t} i18nKey="blog" />
                    </NavLink>
                    <NavLink href="https://support.rallly.co">
                      <Trans t={t} i18nKey="support" />
                    </NavLink>
                  </nav>
                </div>
                <div className="flex items-center gap-4 sm:gap-8">
                  <Link
                    href={linkToApp("/login")}
                    className="hover:text-primary text-muted-foreground hidden rounded text-sm font-medium hover:no-underline hover:underline-offset-2 lg:inline-flex"
                  >
                    <Trans t={t} i18nKey="login" defaults="Login" />
                  </Link>
                  <Button
                    asChild
                    variant="primary"
                    className="rounded-full px-3"
                  >
                    <Link href={linkToApp("/register")}>
                      <Trans t={t} i18nKey="signUp" defaults="Sign up" />
                    </Link>
                  </Button>
                  <div className="flex items-center justify-center lg:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MenuIcon className="size-6" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={16}>
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-3 p-2 text-lg"
                            href="https://support.rallly.co/workflow/create"
                          >
                            <Trans
                              t={t}
                              i18nKey="howItWorks"
                              defaults="How it Works"
                            />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-3 p-2 text-lg"
                            href="/pricing"
                          >
                            <Trans t={t} i18nKey="pricing" defaults="Pricing" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-3 p-2 text-lg"
                            href="/blog"
                          >
                            <Trans t={t} i18nKey="blog" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-3 p-2 text-lg"
                            href="https://support.rallly.co"
                          >
                            <Trans t={t} i18nKey="support" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-3 p-2 text-lg"
                            href={linkToApp("/login")}
                          >
                            <Trans t={t} i18nKey="login" defaults="Login" />
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </header>
              <section className="relative grow">{children}</section>
              <hr className="border-transparent" />
              <footer>
                <Footer />
              </footer>
            </div>
          </I18nProvider>
        </LazyMotion>
        <Analytics />
      </body>
    </html>
  );
}
