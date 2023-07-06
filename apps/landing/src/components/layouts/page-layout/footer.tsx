import {
  DiscordIcon,
  LanguagesIcon,
  StarIcon,
  TwitterIcon,
} from "@rallly/icons";
import languages from "@rallly/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

import { Trans } from "@/components/trans";
import DigitalOcean from "~/digitalocean.svg";
import Logo from "~/logo.svg";
import Sentry from "~/sentry.svg";
import Vercel from "~/vercel-logotype-dark.svg";

export const LanguageSelect = () => {
  const router = useRouter();

  return (
    <Select
      value={router.locale}
      onValueChange={(newLocale) => {
        router.replace(router.asPath, undefined, {
          locale: newLocale,
          scroll: false,
        });
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const Footer: React.FunctionComponent = () => {
  return (
    <div className="mx-auto space-y-8">
      <div className="space-y-8 lg:flex lg:space-x-16 lg:space-y-0">
        <div className=" lg:w-2/6">
          <Logo className="w-32 text-gray-500" />
          <div className="mb-8 mt-4 text-gray-500">
            <p className="mb-4 leading-relaxed">
              <Trans
                i18nKey="common_footerSponsor"
                components={{
                  a: (
                    <Link
                      className="font-normal leading-loose text-gray-500 underline hover:text-gray-800 hover:underline"
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
                    <Link
                      className="font-normal leading-loose text-gray-500 underline hover:text-gray-800 hover:underline"
                      href="https://twitter.com/imlukevella"
                    />
                  ),
                }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              target="_blank"
              href="https://twitter.com/ralllyco"
              className="hover:text-primary-600 text-sm text-gray-500 transition-colors hover:no-underline"
            >
              <TwitterIcon className="h-5 w-5" />
            </Link>
            <Link
              target="_blank"
              href="https://discord.gg/uzg4ZcHbuM"
              className="hover:text-primary-600 text-sm text-gray-500 transition-colors hover:no-underline"
            >
              <DiscordIcon className="h-5 w-5" />
            </Link>
            <Link
              target="_blank"
              href="https://github.com/lukevella/rallly"
              className="hover:bg-primary-600 focus:ring-primary-600 active:bg-primary-600 inline-flex h-8 items-center rounded-full bg-gray-100 pl-2 pr-3 text-sm text-gray-500 transition-colors hover:text-white hover:no-underline focus:ring-2 focus:ring-offset-1"
            >
              <StarIcon className="mr-2 inline-block w-5" />
              <span>
                <Trans
                  i18nKey="common_starOnGithub"
                  defaults="Star us on Github"
                />
              </span>
            </Link>
          </div>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-4 font-medium">
            <Trans i18nKey="homepage_links" defaults="Links" />
          </div>
          <ul className="space-y-2">
            <li>
              <Link
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
                href="/pricing"
              >
                <Trans i18nKey="pricing" defaults="Pricing" />
              </Link>
            </li>
            <li>
              <Link
                target="_blank"
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
                href="https://github.com/lukevella/rallly/discussions"
              >
                <Trans i18nKey="common_discussions" defaults="Discussions" />
              </Link>
            </li>
            <li>
              <Link
                href="https://rallly.co/blog"
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
              >
                <Trans i18nKey="common_blog" defaults="Blog" />
              </Link>
            </li>
            <li>
              <Link
                href="https://support.rallly.co"
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
              >
                <Trans i18nKey="common_support" defaults="Support" />
              </Link>
            </li>
          </ul>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-4 font-medium">
            <Trans i18nKey="common_poweredBy" defaults="Powered by" />
          </div>
          <div className="block space-y-4">
            <div>
              <Link
                target="_blank"
                href="https://vercel.com?utm_source=rallly&utm_campaign=oss"
                className="inline-block text-white"
              >
                <Vercel className="h-5" />
              </Link>
            </div>
            <div>
              <Link
                target="_blank"
                className="inline-block"
                href="https://m.do.co/c/f91efc9c9e50"
              >
                <DigitalOcean className="h-7" />
              </Link>
            </div>
            <div>
              <Link
                target="_blank"
                className="inline-block"
                href="https://sentry.io"
              >
                <Sentry className="h-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:w-2/6">
          <div className="mb-4 font-medium">
            <Trans i18nKey="common_language" defaults="Language" />
          </div>
          <div className="mb-4">
            <LanguageSelect />
          </div>
          <Link
            href="https://support.rallly.co/contribute/translations"
            className="hover:border-primary-600 hover:text-primary-600 inline-flex items-center rounded-md border px-3 py-2 text-xs text-gray-500"
          >
            <LanguagesIcon className="mr-2 h-5 w-5" />
            <Trans i18nKey="common_volunteerTranslator" /> &rarr;
          </Link>
        </div>
      </div>
      <ul className="flex gap-4 text-sm leading-loose">
        <li>
          <Link
            href="/privacy-policy"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="common_privacyPolicy" />
          </Link>
        </li>
        <li>
          <Link
            href="/cookie-policy"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="common_cookiePolicy" />
          </Link>
        </li>
        <li>
          <Link
            href="/terms-of-use"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="common_termsOfUse" />
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Footer;
