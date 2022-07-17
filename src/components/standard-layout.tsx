import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import React from "react";

import Menu from "@/components/icons/menu.svg";
import User from "@/components/icons/user.svg";
import UserCircle from "@/components/icons/user-circle.svg";
import Logo from "~/public/logo.svg";

import Dropdown, { DropdownItem, DropdownProps } from "./dropdown";
import Adjustments from "./icons/adjustments.svg";
import Cash from "./icons/cash.svg";
import DotsVertical from "./icons/dots-vertical.svg";
import Github from "./icons/github.svg";
import Login from "./icons/login.svg";
import Logout from "./icons/logout.svg";
import Pencil from "./icons/pencil.svg";
import Question from "./icons/question-mark-circle.svg";
import Support from "./icons/support.svg";
import Twitter from "./icons/twitter.svg";
import LoginForm from "./login-form";
import { useModal } from "./modal";
import { useModalContext } from "./modal/modal-provider";
import Popover from "./popover";
import Preferences from "./preferences";
import { useSession } from "./session";

const HomeLink = () => {
  return (
    <Link href="/">
      <a>
        <Logo className="inline-block w-28 text-primary-500 transition-colors active:text-primary-600 lg:w-32" />
      </a>
    </Link>
  );
};

const MobileNavigation: React.VoidFunctionComponent<{
  openLoginModal: () => void;
}> = ({ openLoginModal }) => {
  const { user } = useSession();
  const { t } = useTranslation("app");
  return (
    <div
      className="fixed top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between border-b bg-gray-50
     px-4 lg:hidden"
    >
      <div>
        <HomeLink />
      </div>
      <div className="flex items-center">
        {user ? null : (
          <button
            onClick={openLoginModal}
            className="flex w-full cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
          >
            <Login className="h-5 opacity-75" />
            <span className="inline-block">{t("login")}</span>
          </button>
        )}
        <AnimatePresence initial={false}>
          {user ? (
            <UserDropdown
              openLoginModal={openLoginModal}
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
                  className="group inline-flex w-full items-center space-x-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-500/10 active:bg-slate-500/20"
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
              <span className="ml-2 hidden sm:block">{t("preferences")}</span>
            </button>
          }
        >
          <Preferences />
        </Popover>
        <Popover
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className="group flex items-center rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Menu className="w-5 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">{t("menu")}</span>
            </button>
          }
        >
          <AppMenu className="-m-2" />
        </Popover>
      </div>
    </div>
  );
};

const AppMenu: React.VoidFunctionComponent<{ className?: string }> = ({
  className,
}) => {
  const { t } = useTranslation("app");
  return (
    <div className={clsx("space-y-1", className)}>
      <Link href="/new">
        <a className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
          <Pencil className="h-5 opacity-75 " />
          <span className="inline-block">{t("newPoll")}</span>
        </a>
      </Link>
      <a
        target="_blank"
        href="https://support.rallly.co"
        className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
        rel="noreferrer"
      >
        <Support className="h-5 opacity-75" />
        <span className="inline-block">{t("support")}</span>
      </a>
    </div>
  );
};

const UserDropdown: React.VoidFunctionComponent<
  DropdownProps & { openLoginModal: () => void }
> = ({ children, openLoginModal, ...forwardProps }) => {
  const { logout, user } = useSession();
  const { t } = useTranslation("app");
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
          label={t("whatsThis")}
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
                        Guest
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.shortName}
                      </div>
                    </div>
                  </div>
                  <p>{t("guestSessionNotice")}</p>
                  <div>
                    <a
                      href="https://support.rallly.co/guest-sessions"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("guestSessionReadMore")}
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
        <DropdownItem href="/profile" icon={User} label="Your profile" />
      ) : null}
      {user.isGuest ? (
        <DropdownItem icon={Login} label="Login" onClick={openLoginModal} />
      ) : null}
      <DropdownItem
        icon={Logout}
        label={user.isGuest ? t("forgetMe") : t("logout")}
        onClick={() => {
          if (user?.isGuest) {
            modalContext.render({
              title: t("areYouSure"),
              description: t("endingGuestSessionNotice"),

              onOk: logout,
              okButtonProps: {
                type: "danger",
              },
              okText: t("endSession"),
              cancelText: t("cancel"),
            });
          } else {
            logout();
          }
        }}
      />
    </Dropdown>
  );
};

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  const { user } = useSession();
  const { t } = useTranslation("app");
  const [loginModal, openLoginModal] = useModal({
    footer: null,
    overlayClosable: true,
    showClose: true,
    content: <LoginForm />,
  });

  return (
    <div
      className="relative flex min-h-full flex-col bg-gray-50 lg:flex-row"
      {...rest}
    >
      {loginModal}
      <MobileNavigation openLoginModal={openLoginModal} />
      <div className="hidden grow px-4 pt-6 pb-5 lg:block">
        <div className="sticky top-6 float-right w-48 items-start">
          <div className="mb-8 px-3">
            <HomeLink />
          </div>
          <div className="mb-4">
            <Link href="/new">
              <a className="group mb-1 flex items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20">
                <Pencil className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                <span className="grow text-left">{t("newPoll")}</span>
              </a>
            </Link>
            <a
              target="_blank"
              href="https://support.rallly.co"
              className="group mb-1 flex items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20"
              rel="noreferrer"
            >
              <Support className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
              <span className="grow text-left">{t("support")}</span>
            </a>
            <Popover
              placement="right-start"
              trigger={
                <button className="group flex w-full items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20">
                  <Adjustments className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                  <span className="grow text-left">{t("preferences")}</span>
                  <DotsVertical className="h-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              }
            >
              <Preferences />
            </Popover>
            {user ? null : (
              <button
                onClick={openLoginModal}
                className="group flex w-full items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20"
              >
                <Login className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                <span className="grow text-left">{t("login")}</span>
              </button>
            )}
          </div>
          <AnimatePresence initial={false}>
            {user ? (
              <UserDropdown
                className="w-full"
                placement="bottom-end"
                openLoginModal={openLoginModal}
                trigger={
                  <motion.button
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0, transition: { duration: 0.2 } }}
                    className="group w-full rounded-lg p-2 px-3 text-left text-inherit transition-colors hover:bg-slate-500/10 active:bg-slate-500/20"
                  >
                    <div className="flex w-full items-center space-x-3">
                      <div className="relative">
                        <UserCircle className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                      </div>
                      <div className="grow overflow-hidden">
                        <div className="truncate font-medium leading-snug text-slate-600">
                          {user.shortName}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {user.isGuest ? t("guest") : t("user")}
                        </div>
                      </div>
                      <DotsVertical className="h-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </motion.button>
                }
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <div className="min-w-0 grow">
        <div className="max-w-full pt-12 md:w-[1024px] lg:min-h-[calc(100vh-64px)] lg:pt-0">
          {children}
        </div>
        <div className="flex flex-col items-center space-y-4 px-6 pt-3 pb-6 text-slate-400 lg:h-16 lg:flex-row lg:space-y-0 lg:space-x-6 lg:py-0 lg:px-8 lg:pb-3">
          <div>
            <Link href="https://rallly.co">
              <a className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                <Logo className="h-5" />
              </a>
            </Link>
          </div>
          <div className="hidden text-slate-300 lg:block">&bull;</div>
          <div className="flex items-center justify-center space-x-6 md:justify-start">
            <a
              target="_blank"
              href="https://support.rallly.co"
              className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline"
              rel="noreferrer"
            >
              {t("support")}
            </a>
            <Link href="https://github.com/lukevella/rallly/discussions">
              <a className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                {t("discussions")}
              </a>
            </Link>
            <Link href="https://blog.rallly.co">
              <a className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                {t("blog")}
              </a>
            </Link>
            <div className="hidden text-slate-300 lg:block">&bull;</div>
            <div className="flex items-center space-x-6">
              <Link href="https://twitter.com/ralllyco">
                <a className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                  <Twitter className="h-5 w-5" />
                </a>
              </Link>
              <Link href="https://github.com/lukevella/rallly">
                <a className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                  <Github className="h-5 w-5" />
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden text-slate-300 lg:block">&bull;</div>
          <Link href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E">
            <a className="inline-flex h-8 items-center rounded-full bg-slate-100 pl-2 pr-3 text-sm text-slate-400 transition-colors hover:bg-primary-500 hover:text-white hover:no-underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-600">
              <Cash className="mr-1 inline-block w-5" />
              <span>{t("donate")}</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StandardLayout;
