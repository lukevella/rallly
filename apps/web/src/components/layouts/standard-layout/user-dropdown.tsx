import {
  LoginIcon,
  LogoutIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from "@rallly/icons";
import { useTranslation } from "next-i18next";
import React from "react";

import { useLoginModal } from "@/components/auth/login-modal";
import Dropdown, { DropdownItem, DropdownProps } from "@/components/dropdown";
import { useModalContext } from "@/components/modal/modal-provider";
import { useUser } from "@/components/user-provider";

export const UserDropdown: React.FunctionComponent<DropdownProps> = ({
  children,
  ...forwardProps
}) => {
  const { logout, user } = useUser();
  const { t } = useTranslation();
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
          icon={QuestionMarkCircleIcon}
          label={t("whatsThis")}
          onClick={() => {
            modalContext.render({
              showClose: true,
              content: (
                <div className="w-96 max-w-full p-6 pt-28">
                  <div className="absolute left-0 -top-8 w-full text-center">
                    <div className="to-primary-600 inline-flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-gradient-to-b from-purple-400">
                      <UserIcon className="h-7 text-white" />
                    </div>
                    <div className="">
                      <div className="text-lg font-medium leading-snug">
                        {t("guest")}
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
                      className="text-link"
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
        <DropdownItem
          href="/profile"
          icon={UserIcon}
          label={t("yourProfile")}
        />
      ) : null}
      {user.isGuest ? (
        <DropdownItem
          icon={LoginIcon}
          label={t("login")}
          onClick={openLoginModal}
        />
      ) : null}
      {user.isGuest ? (
        <DropdownItem
          icon={LogoutIcon}
          label={t("forgetMe")}
          onClick={() => {
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
          }}
        />
      ) : (
        <DropdownItem icon={LogoutIcon} href="/logout" label={t("logout")} />
      )}
    </Dropdown>
  );
};
