"use client";

import { cn } from "@rallly/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { ChevronRightIcon, MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trans } from "next-i18next";
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
  const pathname = usePathname();
  const isActive = pathname === props.href;
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-x-2.5 rounded text-sm font-medium",
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
  return (
    <nav className={className}>
      <NavLink href="https://support.rallly.co/workflow/create">
        <Trans i18nKey="howItWorks" defaults="How it Works" />
      </NavLink>
      <NavLink href="/pricing">
        <Trans i18nKey="pricing" />
      </NavLink>
      <NavLink href="/blog">
        <Trans i18nKey="blog" />
      </NavLink>
      <NavLink href="https://support.rallly.co">
        <Trans i18nKey="support" />
      </NavLink>
    </nav>
  );
};

export const PageLayout: React.FunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 p-4 sm:p-8">
      <header className="flex w-full items-center">
        <div className="flex grow items-center gap-x-12">
          <Link className="inline-block rounded" href="/">
            <Image src="/logo.svg" width={130} height={30} alt="rallly.co" />
          </Link>
          <Menu className="hidden items-center space-x-8 lg:flex" />
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href={linkToApp("/login")}
            className="hover:text-primary text-muted-foreground hidden rounded text-sm font-medium hover:no-underline hover:underline-offset-2 lg:inline-flex"
          >
            <Trans i18nKey="login" defaults="Login" />
          </Link>
          <Link
            href={linkToApp()}
            className="bg-primary hover:bg-primary-500 active:bg-primary-700 group inline-flex items-center gap-1 rounded-full py-1.5 pl-4 pr-3 text-sm font-medium text-white shadow-sm transition-transform"
          >
            <span>
              <Trans i18nKey="goToApp" defaults="Go to app" />
            </span>
            <ChevronRightIcon className="inline-block size-4 transition-all group-active:translate-x-1" />
          </Link>
          <div className="flex items-center justify-center lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MenuIcon className="size-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={16}>
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-3 p-2 text-lg"
                    href="https://support.rallly.co/workflow/create"
                  >
                    <Trans i18nKey="howItWorks" defaults="How it Works" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-3 p-2 text-lg"
                    href="/pricing"
                  >
                    <Trans i18nKey="pricing" defaults="Pricing" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-3 p-2 text-lg"
                    href="/blog"
                  >
                    <Trans i18nKey="blog" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-3 p-2 text-lg"
                    href="https://support.rallly.co"
                  >
                    <Trans i18nKey="support" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    className="flex items-center gap-3 p-2 text-lg"
                    href={linkToApp("/login")}
                  >
                    <Trans i18nKey="login" defaults="Login" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <section>{children}</section>
      <hr className="border-transparent" />
      <footer>
        <Footer />
      </footer>
    </div>
  );
};

export const getPageLayout = (page: React.ReactElement) => (
  <PageLayout>{page}</PageLayout>
);

export default PageLayout;
