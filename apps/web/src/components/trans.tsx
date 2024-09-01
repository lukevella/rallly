import { Trans as BaseTrans } from "react-i18next";

import { useTranslation } from "@/app/i18n/client";

import { I18nNamespaces } from "../../declarations/i18next";

export const Trans = (props: {
  i18nKey: keyof I18nNamespaces["app"];
  defaults?: string;
  values?: Record<string, string | number | boolean | undefined>;
  children?: React.ReactNode;
  components?: Record<string, React.ReactElement> | React.ReactElement[];
}) => {
  const { t } = useTranslation("app");
  return <BaseTrans ns="app" t={t} {...props} />;
};
