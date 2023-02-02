import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import React from "react";

import { LoginLink, useLoginModal } from "@/components/auth/login-modal";
import Dropdown, { DropdownItem, DropdownProps } from "@/components/dropdown";
import Adjustments from "@/components/icons/adjustments.svg";
import Login from "@/components/icons/login.svg";
import Logout from "@/components/icons/logout.svg";
import Menu from "@/components/icons/menu.svg";
import Pencil from "@/components/icons/pencil.svg";
import Question from "@/components/icons/question-mark-circle.svg";
import Support from "@/components/icons/support.svg";
import User from "@/components/icons/user.svg";
import UserCircle from "@/components/icons/user-circle.svg";
import { useModalContext } from "@/components/modal/modal-provider";
import Popover from "@/components/popover";
import Preferences from "@/components/preferences";
import { useUser } from "@/components/user-provider";

import { HomeLink } from "./home-link";

export const MobileNavigation = (props: { className?: string }) => {
  const { user, isUpdating } = useUser();
  const { t } = useTranslation(["common", "app"]);

  const [isPinned, setIsPinned] = React.useState(false);

  React.useEffect(() => {
    const scrollHandler = () => {
      if (window.scrollY > 32) {
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
        "sticky top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between border-b p-3 transition-all",
        {
          "bg-white/90 backdrop-blur-md": isPinned,
          "border-transparent": !isPinned,
        },
        props.className,
      )}
    >
      <div>
        <Popover
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className="group flex items-center rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Menu className="w-5 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">{t("app:menu")}</span>
            </button>
          }
        >
          <AppMenu />
        </Popover>
      </div>
      <div className="flex items-center">
        {user ? null : (
          <LoginLink className="flex w-full cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
            <Login className="h-5 opacity-75" />
            <span className="inline-block">{t("app:login")}</span>
          </LoginLink>
        )}
        <AnimatePresence initial={false}>
          {user ? (
            <UserDropdown
              placement="bottom-end"
              trigger={
                <motion.button
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{
                    y: -50,
                    opacity: 0,
                  }}
                  data-testid="user"
                  className={clsx(
                    "group inline-flex w-full items-center space-x-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-500/10 active:bg-slate-500/20",
                    {
                      "opacity-50": isUpdating,
                    },
                  )}
                >
                  <div className="relative shrink-0">
                    <UserCircle className="w-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                  </div>
                  <div className="hidden max-w-[120px] truncate font-medium xs:block">
                    {user.shortName}
                  </div>
                </motion.button>
              }
            />
          ) : null}
        </AnimatePresence>
        <Popover
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className="group flex items-center whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Adjustments className="h-5 opacity-75 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">
                {t("app:preferences")}
              </span>
            </button>
          }
        >
          <Preferences className="p-3" />
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
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md p-2 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
      >
        <HomeLink />
      </Link>
      <Link
        href="/new"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
      >
        <Pencil className="h-5 opacity-75 " />
        <span className="inline-block">{t("app:newPoll")}</span>
      </Link>
      <a
        target="_blank"
        href="https://support.rallly.co"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-600 hover:no-underline active:bg-gray-300"
        rel="noreferrer"
      >
        <Support className="h-5 opacity-75" />
        <span className="inline-block">{t("common:support")}</span>
      </a>
    </div>
  );
};

const UserDropdown: React.VoidFunctionComponent<DropdownProps> = ({
  children,
  ...forwardProps
}) => {
  const { logout, user } = useUser();
  const { t } = useTranslation(["common", "app"]);
  const { openLoginModal } = useLoginModal();
  const modalContext = useModalContext();
  if (!user) {
    return null;
  }
  return (
    <Dropdown {...forwardProps}>
      {children}
      {user.isGuest ? (
        <DropdownItem
          icon={Question}
          label={t("app:whatsThis")}
          onClick={() => {
            modalContext.render({
              showClose: true,
              content: (
                <div className="w-96 max-w-full p-6 pt-28">
                  <div className="absolute left-0 -top-8 w-full text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-gradient-to-b from-purple-400 to-primary-500">
                      <User className="h-7 text-white" />
                    </div>
                    <div className="">
                      <div className="text-lg font-medium leading-snug">
                        {t("app:guest")}
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.shortName}
                      </div>
                    </div>
                  </div>
                  <p>{t("app:guestSessionNotice")}</p>
                  <div>
                    <a
                      href="https://support.rallly.co/guest-sessions"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("app:guestSessionReadMore")}
                    </a>
                  </div>
                </div>
              ),
              overlayClosable: true,
              footer: null,
            });
          }}
        />
      ) : null}
      {!user.isGuest ? (
        <DropdownItem
          href="/profile"
          icon={User}
          label={t("app:yourProfile")}
        />
      ) : null}
      {user.isGuest ? (
        <DropdownItem
          icon={Login}
          label={t("app:login")}
          onClick={openLoginModal}
        />
      ) : null}
      <DropdownItem
        icon={Logout}
        label={user.isGuest ? t("app:forgetMe") : t("app:logout")}
        onClick={() => {
          if (user?.isGuest) {
            modalContext.render({
              title: t("app:areYouSure"),
              description: t("app:endingGuestSessionNotice"),

              onOk: logout,
              okButtonProps: {
                type: "danger",
              },
              okText: t("app:endSession"),
              cancelText: t("app:cancel"),
            });
          } else {
            logout();
          }
        }}
      />
    </Dropdown>
  );
};
