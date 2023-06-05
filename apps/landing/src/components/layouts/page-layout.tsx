import { ArrowRightIcon } from "@rallly/icons";
import { absoluteUrl } from "@rallly/utils";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Footer from "./page-layout/footer";

export interface PageLayoutProps {
  children?: React.ReactNode;
}

const Menu: React.FunctionComponent<{ className: string }> = ({
  className,
}) => {
  const { pathname } = useRouter();
  const { t } = useTranslation();
  return (
    <nav className={className}>
      <Link
        href="/"
        className={clsx(
          "hover:text-primary text-muted-foreground rounded text-sm font-medium transition-colors hover:no-underline hover:underline-offset-2",
          {
            "pointer-events-none font-bold text-gray-600": pathname === "/home",
          },
        )}
      >
        <Trans i18nKey="pricing" defaults="Pricing" />
      </Link>
      <Link
        href="https://blog.rallly.co"
        className={clsx(
          "hover:text-primary text-muted-foreground rounded text-sm font-medium transition-colors hover:no-underline hover:underline-offset-2",
        )}
      >
        {t("common_blog")}
      </Link>
      <Link
        href="https://support.rallly.co"
        className="hover:text-primary text-muted-foreground rounded text-sm font-medium transition-colors hover:no-underline hover:underline-offset-2"
      >
        {t("common_support")}
      </Link>
    </nav>
  );
};

const PageLayout: React.FunctionComponent<PageLayoutProps> = ({ children }) => {
  return (
    <div className="isolate min-h-full overflow-x-hidden bg-gray-100">
      <svg
        className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(800px_800px_at_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
            width={220}
            height={220}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 220V.5H220" fill="none" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
        />
      </svg>
      <div className="mx-auto flex max-w-7xl items-center px-8 py-8">
        <div className="flex grow items-center gap-x-12">
          <Link className="inline-block rounded" href="https://app.rallly.co">
            <Image src="/logo.svg" width={130} height={30} alt="rallly.co" />
          </Link>
          <Menu className="hidden items-center space-x-8 sm:flex" />
        </div>
        <div className="flex items-center gap-8">
          <Link
            href={absoluteUrl("/login")}
            className="hover:text-primary text-muted-foreground rounded text-sm font-medium transition-colors hover:no-underline hover:underline-offset-2"
          >
            <Trans i18nKey="login" defaults="Login" />
          </Link>
          <Link
            href={absoluteUrl()}
            className="bg-primary border-primary-800 group inline-flex items-center gap-2 rounded-full py-1.5 pl-4 pr-3 text-sm font-medium text-white transition-all"
          >
            <span>
              <Trans i18nKey="goToApp" defaults="Go to app" />
            </span>
            <ArrowRightIcon className="inline-block h-4 w-4 -translate-x-1 transition-all group-hover:translate-x-0 group-active:translate-x-1" />
          </Link>
        </div>
      </div>
      <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
      <Footer />
    </div>
  );
};

export default PageLayout;
