import { useTranslation } from "next-i18next";

import UserAvatar from "./poll/user-avatar";

export const You = () => {
  const { t } = useTranslation("app");
  return <UserAvatar name={t("you")} showName={true} />;
};
