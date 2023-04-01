import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import React from "react";

import { LoginLink } from "@/components/auth/login-modal";
import Adjustments from "@/components/icons/adjustments.svg";
import Beaker from "@/components/icons/beaker.svg";
import Home from "@/components/icons/home.svg";
import Login from "@/components/icons/login.svg";
import Menu from "@/components/icons/menu.svg";
import Pencil from "@/components/icons/pencil.svg";
import Support from "@/components/icons/support.svg";
import UserCircle from "@/components/icons/user-circle.svg";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import Preferences from "@/components/preferences";
import { useUser } from "@/components/user-provider";

import Dropdown, { DropdownItem } from "../../dropdown";
import { Logo } from "../../logo";
import { useModalContext } from "../../modal/modal-provider";
import OpenBeta from "../../open-beta-modal";
import { UserDropdown } from "./user-dropdown";

export const MobileNavigation = (props: { className?: string }) => {
  const { user } = useUser();
  const { t } = useTranslation(["common", "app"]);

  const [isPinned, setIsPinned] = React.useState(false);
  const modalContext = useModalContext();

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
        "sticky top-0 z-40 flex w-full shrink-0 items-center justify-between border-b p-2",
        {
          "bg-gray-50 shadow-sm sm:bg-gray-50/75 sm:backdrop-blur-md ":
            isPinned,
          "bg-gray-50 shadow-none sm:border-transparent sm:bg-gray-50/0":
            !isPinned,
        },
        props.className,
      )}
    >
      <div>
        <Dropdown
          placement="bottom-start"
          trigger={
            <button
              role="button"
              type="button"
              className="group flex items-center rounded px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Menu className="group-hover:text-primary-600 mr-2 w-5" />
              <Logo />
            </button>
          }
        >
          <DropdownItem href="/" label={t("home")} icon={Home} />
          <DropdownItem href="/new" label={t("app:createNew")} icon={Pencil} />
          <DropdownItem
            href="https://support.rallly.co"
            label={t("support")}
            icon={Support}
          />
          {process.env.NEXT_PUBLIC_BETA === "1" ? (
            <>
              <DropdownItem
                onClick={() => {
                  // open modal
                  modalContext.render({
                    content: <OpenBeta />,
                    footer: null,
                    showClose: true,
                    overlayClosable: true,
                  });
                }}
                label="Feedback"
                icon={Beaker}
              />
            </>
          ) : null}
        </Dropdown>
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
                  )}
                >
                  <div className="relative shrink-0">
                    <UserCircle className="group-hover:text-primary-600 w-5 opacity-75 group-hover:opacity-100" />
                  </div>
                  <div className="xs:block max-w-[120px] truncate font-medium">
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
              <Adjustments className="group-hover:text-primary-600 h-5 opacity-75" />
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
