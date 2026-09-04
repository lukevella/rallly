import languages from "@rallly/languages";
import type { Viewport } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";

import { Trans } from "react-i18next/TransWithoutContext";

import { CtaButton } from "@/components/home/cta-button";
import { LoginButton } from "@/components/login-button";
import { LinkBase } from "@/i18n/client/link";
import { getTranslation } from "@/i18n/server";
import { Footer } from "./footer";
import { MobileMenu } from "./mobile-menu";
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
    <div className="relative z-10 flex min-h-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 bg-gray-100">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-6 sm:py-6">
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
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <LoginButton />
              </div>
              <CtaButton
                size="default"
                captureEvent="landing:header_cta_click"
                cta="header"
              >
                <Trans
                  t={t}
                  ns="home"
                  i18nKey="createAPoll"
                  defaults="Create a poll"
                />
              </CtaButton>
            </div>
            <div className="flex items-center justify-center lg:hidden">
              <MobileMenu
                links={[
                  { href: "/pricing", label: t("pricing") },
                  { href: "/blog", label: t("blog") },
                  { href: "https://support.rallly.co", label: t("support") },
                ]}
                menuLabel={t("menu", { defaultValue: "Menu" })}
                closeLabel={t("close", { defaultValue: "Close" })}
                loginLabel={t("login", { defaultValue: "Login" })}
                ctaLabel={t("createAPoll", {
                  ns: "home",
                  defaultValue: "Create a poll",
                })}
              />
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl grow flex-col space-y-8 px-4 pb-4 sm:px-6 sm:pb-6">
        <section className="relative grow">{children}</section>
        <footer className="border-t pt-8 sm:pt-16">
          <Footer locale={locale} />
        </footer>
      </div>
    </div>
  );
}
