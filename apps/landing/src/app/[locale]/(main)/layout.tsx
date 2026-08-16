import languages from "@rallly/languages";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { MenuIcon } from "lucide-react";
import type { Viewport } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";

import { Trans } from "react-i18next/TransWithoutContext";

import { CtaButton } from "@/components/home/cta-button";
import { LoginButton } from "@/components/login-button";
import { LinkBase } from "@/i18n/client/link";
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

export default async function Root(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  "use cache";
  cacheLife("max");
  const { children, params } = props;
  const { locale } = await params;

  const { t } = await getTranslation(locale, ["common", "home"]);
  return (
    <div className="relative z-10 flex min-h-full flex-col">
      <header className="sticky top-0 z-20 bg-gray-100">
        <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex grow items-center gap-x-12">
            <LinkBase
              className="relative inline-block h-7 w-32 rounded-sm"
              href="/"
            >
              <Image
                src="/logo.svg"
                fill
                alt="rallly.co"
                className="object-contain"
              />
            </LinkBase>
            <nav className="hidden items-center gap-2 lg:flex">
              <NavLink href="https://support.rallly.co/workflow/create">
                <Trans t={t} i18nKey="howItWorks" defaults="How it works" />
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
            <div className="hidden items-center gap-2 sm:flex">
              <LoginButton />
              <CtaButton size="default" captureEvent="landing:header_cta_click">
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="createAPoll"
                  defaults="Create a meeting poll"
                />
              </CtaButton>
            </div>
            <div className="flex items-center justify-center lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t("menu", { defaultValue: "Menu" })}
                    />
                  }
                >
                  <Icon>
                    <MenuIcon />
                  </Icon>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  align="end"
                  sideOffset={16}
                >
                  <DropdownMenuItem
                    render={
                      <LinkBase href="https://support.rallly.co/workflow/create" />
                    }
                  >
                    <Trans t={t} i18nKey="howItWorks" defaults="How it works" />
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<LinkBase href="/pricing" />}>
                    <Trans t={t} i18nKey="pricing" defaults="Pricing" />
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<LinkBase href="/blog" />}>
                    <Trans t={t} i18nKey="blog" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<LinkBase href="https://support.rallly.co" />}
                  >
                    <Trans t={t} i18nKey="support" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="space-y-2">
                    <LinkBase
                      href={linkToApp("/login")}
                      className={buttonVariants({
                        variant: "default",
                        className: "w-full",
                      })}
                    >
                      <Trans t={t} i18nKey="login" defaults="Login" />
                    </LinkBase>
                    <CtaButton
                      size="default"
                      className="w-full"
                      captureEvent="landing:header_cta_click"
                    >
                      <Trans
                        t={t}
                        ns="home"
                        i18nKey="createAPoll"
                        defaults="Create a meeting poll"
                      />
                    </CtaButton>
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl grow flex-col space-y-8 px-4 pb-4 sm:px-6 sm:pb-6">
        <section className="relative grow">{children}</section>
        <footer className="border-t pt-8 sm:pt-16">
          <Footer locale={locale} />
        </footer>
      </div>
    </div>
  );
}
