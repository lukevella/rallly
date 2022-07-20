import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Discord from "@/components/icons/discord.svg";
import Star from "@/components/icons/star.svg";
import Translate from "@/components/icons/translate.svg";
import Twitter from "@/components/icons/twitter.svg";
import DigitalOcean from "~/public/digitalocean.svg";
import Logo from "~/public/logo.svg";
import Sentry from "~/public/sentry.svg";
import Vercel from "~/public/vercel-logotype-dark.svg";

import { LanguageSelect } from "../poll/language-selector";

const Footer: React.VoidFunctionComponent = () => {
  const { t } = useTranslation(["common", "homepage"]);
  const router = useRouter();
  return (
    <div className="mt-16 bg-slate-50/70 p-8">
      <div className="space-y-8 lg:grid lg:grid-cols-12 lg:gap-16 lg:space-y-0">
        <div className=" lg:col-span-4">
          <Logo className="w-32 text-slate-400" />
          <div className="mb-8 mt-4 text-slate-400">
            <p>
              <Trans
                t={t}
                i18nKey="common:footerSponsor"
                components={{
                  a: (
                    <a
                      className="font-normal leading-loose text-slate-400 underline hover:text-slate-800 hover:underline"
                      href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E"
                    />
                  ),
                }}
              />
            </p>
            <div>
              <Trans
                t={t}
                i18nKey="common:footerCredit"
                components={{
                  a: (
                    <a
                      className="font-normal leading-loose text-slate-400 underline hover:text-slate-800 hover:underline"
                      href="https://twitter.com/imlukevella"
                    />
                  ),
                }}
              />
            </div>
          </div>
          <div className="mb-8 flex items-center space-x-6">
            <a
              href="https://twitter.com/ralllyco"
              className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://discord.gg/m5UFXavc2C"
              className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline"
            >
              <Discord className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/lukevella/rallly"
              className="inline-flex h-8 items-center rounded-full bg-slate-100 pl-2 pr-3 text-sm text-slate-400 transition-colors hover:bg-primary-500 hover:text-white hover:no-underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-600"
            >
              <Star className="mr-2 inline-block w-5" />
              <span>{t("common:starOnGithub")}</span>
            </a>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="mb-4 font-medium">{t("homepage:links")}</div>
          <ul>
            <li>
              <a
                className="font-normal leading-loose text-slate-400 hover:text-slate-800 hover:no-underline"
                href="https://github.com/lukevella/rallly/discussions"
              >
                {t("homepage:discussions")}
              </a>
            </li>
            <li>
              <Link href="https://blog.rallly.co">
                <a className="font-normal leading-loose text-slate-400 hover:text-slate-800 hover:no-underline">
                  {t("homepage:blog")}
                </a>
              </Link>
            </li>
            <li>
              <a
                href="https://support.rallly.co"
                className="font-normal leading-loose text-slate-400 hover:text-slate-800 hover:no-underline"
              >
                {t("homepage:support")}
              </a>
            </li>
            <li>
              <Link href="/privacy-policy">
                <a className="font-normal leading-loose text-slate-400 hover:text-slate-800 hover:no-underline">
                  {t("homepage:privacyPolicy")}
                </a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <div className="mb-4 font-medium">{t("homepage:poweredBy")}</div>
          <div className="block space-y-4">
            <div>
              <a
                href="https://vercel.com?utm_source=rallly&utm_campaign=oss"
                className="inline-block text-white"
              >
                <Vercel className="h-5" />
              </a>
            </div>
            <div>
              <a className="inline-block" href="https://m.do.co/c/f91efc9c9e50">
                <DigitalOcean className="h-7" />
              </a>
            </div>
            <div>
              <a className="inline-block" href="https://sentry.io">
                <Sentry className="h-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="mb-4 font-medium">{t("common:language")}</div>
          <LanguageSelect
            className="mb-4 w-full"
            onChange={(locale) => {
              router.push(router.asPath, router.asPath, { locale });
            }}
          />
          <a
            href="https://github.com/lukevella/rallly/wiki/Guide-for-translators"
            className="inline-flex items-center rounded-md border px-3 py-2 text-xs text-slate-500"
          >
            <Translate className="mr-2 h-5 w-5" />
            {t("common:volunteerTranslator")} &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
