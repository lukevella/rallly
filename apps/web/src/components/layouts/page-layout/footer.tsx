import {
  DiscordIcon,
  StarIcon,
  TranslateIcon,
  TwitterIcon,
} from "@rallly/icons";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

import { Trans } from "@/components/trans";
import DigitalOcean from "~/digitalocean.svg";
import Logo from "~/logo.svg";
import Sentry from "~/sentry.svg";
import Vercel from "~/vercel-logotype-dark.svg";

import { LanguageSelect } from "../../poll/language-selector";

const Footer: React.FunctionComponent = () => {
  const router = useRouter();
  return (
    <div className="mt-16 bg-gradient-to-b from-gray-50/0 via-gray-50 to-gray-50 ">
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="space-y-8 lg:flex lg:space-x-16 lg:space-y-0">
          <div className=" lg:w-2/6">
            <Logo className="w-32 text-slate-400" />
            <div className="mb-8 mt-4 text-slate-400">
              <p>
                <Trans
                  i18nKey="common_footerSponsor"
                  components={{
                    a: (
                      <a
                        className="font-normal leading-loose text-slate-500 underline hover:text-slate-800 hover:underline"
                        href="https://support.rallly.co/contribute/donations"
                      />
                    ),
                  }}
                />
              </p>
              <div>
                <Trans
                  i18nKey="common_footerCredit"
                  components={{
                    a: (
                      <a
                        className="font-normal leading-loose text-slate-500 underline hover:text-slate-800 hover:underline"
                        href="https://twitter.com/imlukevella"
                      />
                    ),
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="https://twitter.com/ralllyco"
                className="hover:text-primary-600 text-sm text-slate-500 transition-colors hover:no-underline"
              >
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a
                href="https://discord.gg/uzg4ZcHbuM"
                className="hover:text-primary-600 text-sm text-slate-500 transition-colors hover:no-underline"
              >
                <DiscordIcon className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/lukevella/rallly"
                className="hover:bg-primary-600 focus:ring-primary-600 active:bg-primary-600 inline-flex h-8 items-center rounded-full bg-slate-100 pl-2 pr-3 text-sm text-slate-500 transition-colors hover:text-white hover:no-underline focus:ring-2 focus:ring-offset-1"
              >
                <StarIcon className="mr-2 inline-block w-5" />
                <span>
                  <Trans
                    i18nKey="common_starOnGithub"
                    defaults="Star us on Github"
                  />
                </span>
              </a>
            </div>
          </div>
          <div className="lg:w-1/6">
            <div className="mb-4 font-medium">
              <Trans i18nKey="homepage_links" defaults="Links" />
            </div>
            <ul className="space-y-2">
              <li>
                <a
                  className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
                  href="https://github.com/lukevella/rallly/discussions"
                >
                  <Trans i18nKey="common_discussions" defaults="Discussions" />
                </a>
              </li>
              <li>
                <Link
                  href="https://blog.rallly.co"
                  className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
                >
                  <Trans i18nKey="common_blog" defaults="Blog" />
                </Link>
              </li>
              <li>
                <a
                  href="https://support.rallly.co"
                  className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
                >
                  <Trans i18nKey="common_support" defaults="Support" />
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/6">
            <div className="mb-4 font-medium">
              <Trans i18nKey="common_poweredBy" defaults="Powered by" />
            </div>
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
                <a
                  className="inline-block"
                  href="https://m.do.co/c/f91efc9c9e50"
                >
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
          <div className="lg:w-2/6">
            <div className="mb-4 font-medium">
              <Trans i18nKey="common_language" defaults="Language" />
            </div>
            <LanguageSelect
              className="mb-4 w-full"
              onChange={(locale) => {
                router.push(router.asPath, router.asPath, { locale });
              }}
            />
            <a
              href="https://support.rallly.co/contribute/translations"
              className="hover:border-primary-600 hover:text-primary-600 inline-flex items-center rounded-md border px-3 py-2 text-xs text-slate-500"
            >
              <TranslateIcon className="mr-2 h-5 w-5" />
              <Trans i18nKey="common_volunteerTranslator" /> &rarr;
            </a>
          </div>
        </div>
        <ul className="flex gap-4 text-sm leading-loose">
          <li>
            <Link
              href="/privacy-policy"
              className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
            >
              <Trans i18nKey="common_privacyPolicy" />
            </Link>
          </li>
          <li>
            <Link
              href="/cookie-policy"
              className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
            >
              <Trans i18nKey="common_cookiePolicy" />
            </Link>
          </li>
          <li>
            <Link
              href="/terms-of-use"
              className="inline-block font-normal text-slate-500 hover:text-slate-800 hover:no-underline"
            >
              <Trans i18nKey="common_termsOfUse" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
