import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import GitHubButton from "react-github-btn";

import Logo from "../../public/logo.svg";
import Vercel from "../../public/vercel-logotype-dark.svg";

const Footer: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mt-16 bg-slate-50/70">
      <div className="py-20 px-8 mx-auto max-w-7xl grid grid-cols-10 gap-8">
        <div className="col-span-12 md:col-span-4">
          <Logo className="w-32 mb-4 text-gray-400" />
          <p className="text-sm text-gray-400">
            <Trans
              t={t}
              i18nKey="footerCredit"
              components={{
                a: (
                  <a
                    className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose"
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
              Star
            </GitHubButton>
            <GitHubButton
              href="https://github.com/sponsors/lukevella"
              data-icon="octicon-heart"
              aria-label="Sponsor @lukevella on GitHub"
            >
              Sponsor this project
            </GitHubButton>
          </div>
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="font-medium mb-4">Links</div>
          <ul>
            <li>
              <a
                className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose"
                href="https://github.com/lukevella/rallly/discussions"
              >
                Forum
              </a>
            </li>
            <li>
              <Link href="/blog">
                <a className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose">
                  Blog
                </a>
              </Link>
            </li>
            <li>
              <Link href="/support">
                <a className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose">
                  Support
                </a>
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy">
                <a className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose">
                  Privacy Policy
                </a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="font-medium mb-4">Follow</div>
          <ul>
            <li>
              <a
                className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose"
                href="https://github.com/lukevella/rallly"
              >
                Github
              </a>
            </li>
            <li>
              <a
                className="text-gray-400 hover:text-gray-800 hover:no-underline font-normal leading-loose"
                href="https://twitter.com/ralllyco"
              >
                Twitter
              </a>
            </li>
          </ul>
        </div>
        <div className="col-span-12 md:col-span-2">
          <a
            href="https://vercel.com?utm_source=rallly&utm_campaign=oss"
            className="inline-block text-white"
          >
            <span className="inline-block w-full text-right italic text-gray-400 text-xs mb-1">
              Powered by
            </span>
            <Vercel className="w-24" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
