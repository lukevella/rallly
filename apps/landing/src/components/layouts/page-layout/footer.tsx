import {
  DiscordIcon,
  GithubIcon,
  LanguagesIcon,
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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

import { Trans } from "@/components/trans";
import DigitalOcean from "~/digitalocean.svg";
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
          <Image
            src="/logo-grayscale.svg"
            width={140}
            height={30}
            alt="Rallly"
          />
          <div className="my-8 text-gray-500">
            <p className="mb-4 leading-relaxed">
              <Trans
                i18nKey="footerSponsor"
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
                i18nKey="footerCredit"
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
              className="hover:text-primary-600 text-sm text-gray-500 hover:no-underline"
            >
              <TwitterIcon className="h-5 w-5" />
            </Link>
            <Link
              target="_blank"
              href="https://discord.gg/uzg4ZcHbuM"
              className="hover:text-primary-600 text-sm text-gray-500 hover:no-underline"
            >
              <DiscordIcon className="h-5 w-5" />
            </Link>
            <Link
              target="_blank"
              href="https://github.com/lukevella/rallly"
              className="hover:text-primary-600 text-sm text-gray-500 hover:no-underline"
            >
              <GithubIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-8 font-medium">
            <Trans i18nKey="links" defaults="Links" />
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
                <Trans i18nKey="discussions" defaults="Discussions" />
              </Link>
            </li>
            <li>
              <Link
                href="https://rallly.co/blog"
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
              >
                <Trans i18nKey="blog" defaults="Blog" />
              </Link>
            </li>
            <li>
              <Link
                href="https://support.rallly.co"
                className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
              >
                <Trans i18nKey="support" defaults="Support" />
              </Link>
            </li>
          </ul>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-8 font-medium">
            <Trans i18nKey="poweredBy" defaults="Powered by" />
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
          <div className="mb-8 font-medium">
            <Trans i18nKey="language" defaults="Language" />
          </div>
          <div className="mb-4">
            <LanguageSelect />
          </div>
          <Link
            href="https://support.rallly.co/contribute/translations"
            className="hover:border-primary-600 hover:text-primary-600 inline-flex items-center rounded-md border px-3 py-2 text-xs text-gray-500"
          >
            <LanguagesIcon className="mr-2 h-5 w-5" />
            <Trans i18nKey="volunteerTranslator" /> &rarr;
          </Link>
        </div>
      </div>
      <ul className="flex gap-4 text-sm leading-loose">
        <li>
          <Link
            href="/privacy-policy"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="privacyPolicy" />
          </Link>
        </li>
        <li>
          <Link
            href="/cookie-policy"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="cookiePolicy" />
          </Link>
        </li>
        <li>
          <Link
            href="/terms-of-use"
            className="inline-block font-normal text-gray-500 hover:text-gray-800 hover:no-underline"
          >
            <Trans i18nKey="termsOfUse" />
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Footer;
