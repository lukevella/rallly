import "tailwindcss/tailwind.css";
import "../../style.css";

import languages from "@rallly/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Analytics } from "@vercel/analytics/react";
import { ChevronRightIcon, MenuIcon } from "lucide-react";
import type { Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { sans } from "@/fonts/sans";
import { I18nProvider } from "@/i18n/client";
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
  maximumScale: 1,
  userScalable: false,
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
                    <Trans t={t} i18nKey="howItWorks" defaults="How it Works" />
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
                <Link
                  href={linkToApp()}
                  className="bg-primary hover:bg-primary-500 active:bg-primary-700 group inline-flex items-center gap-1 rounded-full py-1.5 pl-4 pr-3 text-sm font-medium text-white shadow-sm transition-transform"
                >
                  <span>
                    <Trans t={t} i18nKey="goToApp" defaults="Go to app" />
                  </span>
                  <ChevronRightIcon className="inline-block size-4 transition-all group-active:translate-x-1" />
                </Link>
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
        <Analytics />
      </body>
    </html>
  );
}
