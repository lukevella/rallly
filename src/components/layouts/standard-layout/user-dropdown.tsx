import { useTranslation } from "next-i18next";
import React from "react";

import { useLoginModal } from "@/components/auth/login-modal";
import Dropdown, { DropdownItem, DropdownProps } from "@/components/dropdown";
import Login from "@/components/icons/login.svg";
import Logout from "@/components/icons/logout.svg";
import Question from "@/components/icons/question-mark-circle.svg";
import User from "@/components/icons/user.svg";
import { useModalContext } from "@/components/modal/modal-provider";
import { useUser } from "@/components/user-provider";

export const UserDropdown: React.VoidFunctionComponent<DropdownProps> = ({
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
                        Guest
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
                      className="text-link"
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
