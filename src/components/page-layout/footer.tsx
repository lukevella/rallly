import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import GitHubButton from "react-github-btn";

import DigitalOcean from "~/public/digitalocean.svg";
import Logo from "~/public/logo.svg";
import Vercel from "~/public/vercel-logotype-dark.svg";

const Footer: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mt-16 bg-slate-50/70">
      <div className="mx-auto grid max-w-7xl grid-cols-10 gap-8 py-20 px-8">
        <div className="col-span-12 md:col-span-4">
          <Logo className="mb-4 w-32 text-gray-400" />
          <p className="text-sm text-gray-400">
            <Trans
              t={t}
              i18nKey="footerCredit"
              components={{
                a: (
                  <a
                    className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline"
                    href="https://twitter.com/imlukevella"
                  />
                ),
              }}
            />
          </p>
          <div className="flex space-x-3">
            <GitHubButton
              href="https://github.com/lukevella/rallly"
              data-icon="octicon-star"
              aria-label="Star lukevella/rallly on GitHub"
              data-show-count={true}
            >
              {t("star")}
            </GitHubButton>
            <GitHubButton
              href="https://github.com/sponsors/lukevella"
              data-icon="octicon-heart"
              aria-label="Sponsor @lukevella on GitHub"
            >
              {t("sponsorThisProject")}
            </GitHubButton>
          </div>
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="mb-4 font-medium">{t("links")}</div>
          <ul>
            <li>
              <a
                className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline"
                href="https://github.com/lukevella/rallly/discussions"
              >
                {t("discussions")}
              </a>
            </li>
            <li>
              <Link href="https://blog.rallly.co">
                <a className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline">
                  {t("blog")}
                </a>
              </Link>
            </li>
            <li>
              <a
                href="https://support.rallly.co"
                className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline"
              >
                {t("support")}
              </a>
            </li>
            <li>
              <Link href="/privacy-policy">
                <a className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline">
                  {t("privacyPolicy")}
                </a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="mb-4 font-medium">{t("follow")}</div>
          <ul>
            <li>
              <a
                className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline"
                href="https://github.com/lukevella/rallly"
              >
                Github
              </a>
            </li>
            <li>
              <a
                className="font-normal leading-loose text-gray-400 hover:text-gray-800 hover:no-underline"
                href="https://twitter.com/ralllyco"
              >
                Twitter
              </a>
            </li>
          </ul>
        </div>
        <div className="col-span-12 md:col-span-2">
          <div className="mb-4 font-medium">{t("poweredBy")}</div>
          <div className="flex items-end space-x-4 md:block md:space-x-0 md:space-y-2">
            <div>
              <a
                href="https://vercel.com?utm_source=rallly&utm_campaign=oss"
                className="inline-block text-white"
              >
                <Vercel className="h-6" />
              </a>
            </div>
            <div>
              <a href="https://m.do.co/c/f91efc9c9e50">
                <DigitalOcean className="h-8" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
