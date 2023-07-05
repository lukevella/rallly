import {
  ArrowRightIcon,
  GemIcon,
  LifeBuoyIcon,
  LogInIcon,
  MenuIcon,
  NewspaperIcon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { absoluteUrl } from "@rallly/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { linkToApp } from "@/lib/linkToApp";

import Footer from "./page-layout/footer";

export interface PageLayoutProps {
  children?: React.ReactNode;
}

const NavLink = ({
  className,
  ...props
}: React.ComponentProps<typeof Link>) => {
  const router = useRouter();
  const isActive = router.pathname === props.href;
  return (
    <Link
      className={cn(
        "rounded text-sm font-medium",
        isActive ? "" : "hover:text-primary text-muted-foreground ",
        className,
      )}
      {...props}
    />
  );
};

const Menu: React.FunctionComponent<{ className: string }> = ({
  className,
}) => {
  const { t } = useTranslation();
  return (
    <nav className={className}>
      <NavLink href="/blog">{t("common_blog")}</NavLink>
      <NavLink href="/pricing">
        <Trans i18nKey="pricing">Pricing</Trans>
      </NavLink>
      <NavLink href="https://support.rallly.co">{t("common_support")}</NavLink>
    </nav>
  );
};

const PageLayout: React.FunctionComponent<PageLayoutProps> = ({ children }) => {
  return (
    <div className="isolate flex min-h-[100vh] flex-col overflow-x-hidden bg-gray-100">
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
      <div className="mx-auto max-w-full grow p-4 sm:max-w-7xl sm:p-8">
        <div className="mb-16 flex w-full items-center">
          <div className="flex grow items-center gap-x-12">
            <Link className="inline-block rounded" href="/">
              <Image src="/logo.svg" width={130} height={30} alt="rallly.co" />
            </Link>
            <Menu className="hidden items-center space-x-8 sm:flex" />
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              href={absoluteUrl("/login")}
              className="hover:text-primary text-muted-foreground hidden rounded text-sm font-medium hover:no-underline hover:underline-offset-2 sm:inline-flex"
            >
              <Trans i18nKey="login" defaults="Login" />
            </Link>
            <Link
              href={linkToApp()}
              className="bg-primary hover:bg-primary-500 active:bg-primary-700 group inline-flex items-center gap-2 rounded-full py-1.5 pl-4 pr-3 text-sm font-medium text-white shadow-sm transition-transform"
            >
              <span>
                <Trans i18nKey="goToApp" defaults="Go to app" />
              </span>
              <ArrowRightIcon className="inline-block h-4 w-4 -translate-x-1 transition-all group-hover:translate-x-0 group-active:translate-x-1" />
            </Link>
            <div className="flex items-center justify-center sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MenuIcon className="h-6 w-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={16}>
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex items-center gap-3 p-2 text-lg"
                      href="/blog"
                    >
                      <NewspaperIcon className="h-5 w-5" />
                      <Trans i18nKey="common_blog" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex items-center gap-3 p-2 text-lg"
                      href="/pricing"
                    >
                      <GemIcon className="h-5 w-5" />
                      <Trans i18nKey="pricing" defaults="Pricing" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex items-center gap-3 p-2 text-lg"
                      href="https://support.rallly.co"
                    >
                      <LifeBuoyIcon className="h-5 w-5" />
                      <Trans i18nKey="common_support" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex items-center gap-3 p-2 text-lg"
                      href={linkToApp("/login")}
                    >
                      <LogInIcon className="h-5 w-5" />
                      <Trans i18nKey="login" defaults="Login" />
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="grow">{children}</div>
        <div className="pt-36">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export const getPageLayout = (page: React.ReactElement) => (
  <PageLayout>{page}</PageLayout>
);

export default PageLayout;
