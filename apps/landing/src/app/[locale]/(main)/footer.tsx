import Image from "next/image";
import { Trans } from "react-i18next/TransWithoutContext";

import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import LinkedinIcon from "@/assets/linkedin.svg";
import XIcon from "@/assets/x.svg";
import { LinkBase } from "@/i18n/client/link";
import { getTranslation } from "@/i18n/server";
import { LanguageSelect } from "./language-select";

export const Footer = async ({ locale }: { locale: string }) => {
  const { t } = await getTranslation(locale, "common");
  return (
    <div className="mx-auto space-y-12">
      <div className="space-y-6">
        <div className="relative size-8">
          <Image
            src="/logo-footer.svg"
            fill
            alt="Rallly"
            className="object-contain"
          />
        </div>
        <p className="max-w-sm text-pretty text-gray-600 text-sm leading-relaxed">
          <Trans
            t={t}
            ns="common"
            i18nKey="footerTagline"
            defaults="Rallly is an open-source meeting scheduling tool that helps you find the best time to meet, without the back and forth."
          />
        </p>
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
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-6 font-medium text-gray-800 text-sm uppercase tracking-wide">
            <Trans t={t} ns="common" i18nKey="product" defaults="Product" />
          </div>
          <ul className="grid gap-3 text-sm">
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/pricing"
              >
                <Trans t={t} i18nKey="pricing" defaults="Pricing" />
              </LinkBase>
            </li>
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/free-scheduling-poll"
              >
                <Trans
                  t={t}
                  ns="common"
                  i18nKey="schedulingPoll"
                  defaults="Scheduling poll"
                />
              </LinkBase>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-6 font-medium text-gray-800 text-sm uppercase tracking-wide">
            <Trans t={t} ns="common" i18nKey="resources" defaults="Resources" />
          </div>
          <ul className="grid gap-3 text-sm">
            <li>
              <LinkBase
                href="/blog"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans t={t} ns="common" i18nKey="blog" defaults="Blog" />
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
                  t={t}
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
                <Trans t={t} ns="common" i18nKey="support" defaults="Support" />
              </a>
            </li>
            <li>
              <a
                href="https://rallly.openstatus.dev"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans t={t} ns="common" i18nKey="status" defaults="Status" />
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-6 font-medium text-gray-800 text-sm uppercase tracking-wide">
            <Trans t={t} ns="common" i18nKey="compare" defaults="Compare" />
          </div>
          <ul className="grid gap-3 text-sm">
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/best-doodle-alternative"
              >
                <Trans
                  t={t}
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
                  t={t}
                  ns="common"
                  i18nKey="when2MeetAlternative"
                  defaults="When2Meet alternative"
                />
              </LinkBase>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-6 font-medium text-gray-800 text-sm uppercase tracking-wide">
            <Trans
              t={t}
              ns="common"
              i18nKey="schedulingFor"
              defaults="Scheduling for"
            />
          </div>
          <ul className="grid gap-3 text-sm">
            <li>
              <LinkBase
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
                href="/scheduling-for/executive-assistants"
              >
                <Trans
                  t={t}
                  ns="common"
                  i18nKey="executiveAssistants"
                  defaults="Executive assistants"
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
              <LinkBase
                href="/privacy-policy"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans t={t} ns="common" i18nKey="privacyPolicy" />
              </LinkBase>
            </li>
            <li>
              <LinkBase
                href="/cookie-policy"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans t={t} ns="common" i18nKey="cookiePolicy" />
              </LinkBase>
            </li>
            <li>
              <LinkBase
                href="/terms-of-use"
                className="inline-block font-normal text-gray-600 hover:text-gray-800 hover:no-underline"
              >
                <Trans t={t} ns="common" i18nKey="termsOfUse" />
              </LinkBase>
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
