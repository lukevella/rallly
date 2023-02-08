import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import React from "react";

import { LoginLink } from "@/components/auth/login-modal";
import Adjustments from "@/components/icons/adjustments.svg";
import Home from "@/components/icons/home.svg";
import Login from "@/components/icons/login.svg";
import Menu from "@/components/icons/menu.svg";
import Pencil from "@/components/icons/pencil.svg";
import Support from "@/components/icons/support.svg";
import UserCircle from "@/components/icons/user-circle.svg";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import Preferences from "@/components/preferences";
import { useUser } from "@/components/user-provider";

import { Logo } from "../../logo";
import { UserDropdown } from "./user-dropdown";

export const MobileNavigation = (props: { className?: string }) => {
  const { user, isUpdating } = useUser();
  const { t } = useTranslation(["common", "app"]);

  const [isPinned, setIsPinned] = React.useState(false);

  React.useEffect(() => {
    const scrollHandler = () => {
      if (window.scrollY > 0) {
        setIsPinned(true);
      } else {
        setIsPinned(false);
      }
    };
    window.addEventListener("scroll", scrollHandler);
    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  return (
    <div
      className={clsx(
        "sticky top-0 z-40 flex w-full shrink-0 items-center justify-between border-b p-2 transition-all",
        {
          "bg-gray-50/75 shadow-sm backdrop-blur-md ": isPinned,
          "border-transparent bg-gray-50/0 shadow-none": !isPinned,
        },
        props.className,
      )}
    >
      <div>
        <Popover>
          <PopoverTrigger asChild={true}>
            <button
              role="button"
              type="button"
              className="group flex items-center rounded px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Menu className="mr-2 w-5 group-hover:text-primary-500" />
              <Logo />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <AppMenu />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center">
        {user ? null : (
          <LoginLink className="flex w-full cursor-pointer items-center space-x-2 whitespace-nowrap rounded px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
            <Login className="h-5 opacity-75" />
            <span className="inline-block">{t("app:login")}</span>
          </LoginLink>
        )}
        <AnimatePresence initial={false}>
          {user ? (
            <UserDropdown
              placement="bottom-end"
              trigger={
                <button
                  role="button"
                  data-testid="user"
                  className={clsx(
                    "group inline-flex w-full items-center space-x-2 rounded px-2 py-1 text-left transition-colors hover:bg-slate-500/10 active:bg-slate-500/20",
                    {
                      "opacity-50": isUpdating,
                    },
                  )}
                >
                  <div className="relative shrink-0">
                    <UserCircle className="w-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                  </div>
                  <div className="max-w-[120px] truncate font-medium xs:block">
                    {user.isGuest ? t("app:guest") : user.shortName}
                  </div>
                </button>
              }
            />
          ) : null}
        </AnimatePresence>
        <Popover>
          <PopoverTrigger asChild={true}>
            <button
              role="button"
              type="button"
              className="group flex items-center whitespace-nowrap rounded px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Adjustments className="h-5 opacity-75 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">
                {t("app:preferences")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <Preferences className="p-2" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const AppMenu: React.VoidFunctionComponent<{ className?: string }> = ({
  className,
}) => {
  const { t } = useTranslation(["common", "app"]);
  return (
    <div className={clsx("space-y-1", className)}>
      <Link
        href="/"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
      >
        <Home className="h-5 opacity-75 " />
        <span className="inline-block">{t("app:home")}</span>
      </Link>
      <Link
        href="/new"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
      >
        <Pencil className="h-5 opacity-75 " />
        <span className="inline-block">{t("app:createNew")}</span>
      </Link>
      <a
        target="_blank"
        href="https://support.rallly.co"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
        rel="noreferrer"
      >
        <Support className="h-5 opacity-75" />
        <span className="inline-block">{t("common:support")}</span>
      </a>
    </div>
  );
};
