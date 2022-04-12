import Link from "next/link";
import * as React from "react";
import GitHubButton from "react-github-btn";
import { Trans, useTranslation } from "next-i18next";
import Logo from "../../public/logo.svg";

const Footer: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="bg-gradient-to-b from-transparent via-slate-50 to-slate-100">
      <div className="py-24 px-8 mx-auto max-w-7xl grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-4">
          <Logo className="w-32 text-slate-300 mb-8" />
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="font-medium mb-4">Links</div>
          <ul className="footer-menu">
            <li>
              <a href="https://github.com/lukevella/Rallly/discussions">
                Forum
              </a>
            </li>
            <li>
              <Link href="/blog">
                <a>Blog</a>
              </Link>
            </li>
            <li>
              <Link href="/support">
                <a>Support</a>
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy">
                <a>Privacy Policy</a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-6 md:col-span-2">
          <div className="font-medium mb-4">Follow</div>
          <ul className="footer-menu">
            <li>
              <a href="https://github.com/lukevella/Rallly">Github</a>
            </li>
            <li>
              <a href="https://twitter.com/ralllyco">Twitter</a>
            </li>
          </ul>
        </div>
        <div className="col-span-12 md:col-span-3">
          <div className="font-medium mb-4">Project</div>
          <p className="text-sm text-slate-500">
            <Trans
              t={t}
              i18nKey="footerCredit"
              components={{ a: <a href="https://twitter.com/imlukevella" /> }}
            />
          </p>
          <div className="flex space-x-3">
            <GitHubButton
              href="https://github.com/lukevella/Rallly"
              data-icon="octicon-star"
              aria-label="Star lukevella/Rallly on GitHub"
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
      </div>
    </div>
  );
};

export default Footer;
