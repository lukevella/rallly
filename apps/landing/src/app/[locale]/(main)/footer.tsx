"use client";

import languages, { supportedLngs } from "@rallly/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";

import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import LinkedinIcon from "@/assets/linkedin.svg";
import XIcon from "@/assets/x.svg";
import { LinkBase } from "@/i18n/client/link";
import { Trans } from "@/i18n/client/trans";
import { useTranslation } from "@/i18n/client/use-translation";

const LanguageSelect = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { t, i18n } = useTranslation();
  return (
    <Select
      items={languages}
      value={i18n.language}
      onValueChange={(newLocale) => {
        if (!newLocale) {
          return;
        }

        const isLocalizedPath = supportedLngs.some((lng) =>
          pathname?.startsWith(`/${lng}`),
        );

        const newPath = isLocalizedPath
          ? pathname.replace(new RegExp(`^/${i18n.language}`), "")
          : pathname;

        router.replace(`/${newLocale}${newPath}`);
      }}
    >
      <SelectTrigger
        className="w-full"
        aria-label={t("language", { defaultValue: "Language" })}
      >
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

export const Footer: React.FunctionComponent = () => {
  const { t } = useTranslation("common");
  return (
    <div className="mx-auto space-y-8">
      <div className="space-y-16 lg:flex lg:space-x-8 lg:space-y-0">
        <div className="lg:mr-16 lg:w-1/4">
          <div className="relative h-[30px] w-[30px]">
            <Image
              src="/logo-footer.svg"
              fill
              alt="Rallly"
              className="object-contain"
            />
          </div>
          <div className="my-8 text-gray-600 text-sm">
            <p className="leading-relaxed">
              <Trans
                ns="common"
                i18nKey="footerTagline"
                defaults="Rallly is an open-source meeting scheduling tool that helps you find the best time to meet, without the back and forth."
              />
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              target="_blank"
              href="https://x.com/ralllyco"
              className="text-gray-600 text-sm hover:text-primary hover:no-underline"
              rel="noreferrer noopener"
              aria-label={t("footerXLabel", { defaultValue: "Follow us on X" })}
            >
              <XIcon className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://discord.gg/uzg4ZcHbuM"
              className="text-gray-600 text-sm hover:text-primary hover:no-underline"
              rel="noreferrer noopener"
              aria-label={t("footerDiscordLabel", {
                defaultValue: "Join us on Discord",
              })}
            >
              <DiscordIcon className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://www.linkedin.com/company/rallly"
              className="text-gray-600 text-sm hover:text-primary hover:no-underline"
              rel="noreferrer noopener"
              aria-label={t("footerLinkedinLabel", {
                defaultValue: "Follow us on LinkedIn",
              })}
            >
              <LinkedinIcon className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://github.com/lukevella/rallly"
              className="text-gray-600 text-sm hover:text-primary hover:no-underline"
              rel="noreferrer noopener"
              aria-label={t("footerGithubLabel", {
                defaultValue: "View our GitHub repository",
              })}
            >
              <GithubIcon className="size-4" />
            </a>
          </div>
        </div>
        <div className="lg:flex-1">
          <div className="mb-8 flex h-[30px] items-center font-medium">
            <Trans ns="common" i18nKey="product" defaults="Product" />
          </div>
          <ul className="grid gap-2 text-sm">
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/pricing"
              >
                <Trans i18nKey="pricing" defaults="Pricing" />
              </LinkBase>
            </li>
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/free-scheduling-poll"
              >
                <Trans
                  ns="common"
                  i18nKey="freeSchedulingPoll"
                  defaults="Free scheduling poll"
                />
              </LinkBase>
            </li>
          </ul>
        </div>
        <div className="lg:flex-1">
          <div className="mb-8 flex h-[30px] items-center font-medium">
            <Trans ns="common" i18nKey="resources" defaults="Resources" />
          </div>
          <ul className="grid gap-2 text-sm">
            <li>
              <LinkBase
                href="/blog"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="blog" defaults="Blog" />
              </LinkBase>
            </li>
            <li>
              <a
                target="_blank"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="https://github.com/lukevella/rallly/discussions"
                rel="noopener"
              >
                <Trans
                  ns="common"
                  i18nKey="discussions"
                  defaults="Discussions"
                />
              </a>
            </li>
            <li>
              <a
                href="https://support.rallly.co"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="support" defaults="Support" />
              </a>
            </li>
            <li>
              <a
                href="https://rallly.openstatus.dev"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="status" defaults="Status" />
              </a>
            </li>
          </ul>
        </div>
        <div className="lg:flex-1">
          <div className="mb-8 flex h-[30px] items-center font-medium">
            <Trans ns="common" i18nKey="compare" defaults="Compare" />
          </div>
          <ul className="grid gap-2 text-sm">
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/best-doodle-alternative"
              >
                <Trans
                  ns="common"
                  i18nKey="doodleAlternative"
                  defaults="Doodle alternative"
                />
              </LinkBase>
            </li>
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/when2meet-alternative"
              >
                <Trans
                  ns="common"
                  i18nKey="when2MeetAlternative"
                  defaults="When2Meet alternative"
                />
              </LinkBase>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-x-8 gap-y-8 sm:pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-x-8 gap-y-2 sm:flex-row sm:items-center">
          <p className="whitespace-nowrap text-gray-600 text-sm leading-loose">
            &copy; 2026 Stack Snap Ltd.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm leading-loose">
            <li>
              <Link
                href="/privacy-policy"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="privacyPolicy" />
              </Link>
            </li>
            <li>
              <Link
                href="/cookie-policy"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="cookiePolicy" />
              </Link>
            </li>
            <li>
              <Link
                href="/terms-of-use"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans ns="common" i18nKey="termsOfUse" />
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <LanguageSelect />
          </div>
        </div>
      </div>
    </div>
  );
};
