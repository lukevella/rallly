import { Trans as BaseTrans, useTranslation } from "react-i18next";

import type { TxKeyPath } from "../i18n/types";

export const Trans = (props: {
  i18nKey: TxKeyPath;
  defaults?: string;
  values?: Record<string, string | number | boolean | undefined>;
  children?: React.ReactNode;
  components?: Record<string, React.ReactElement> | React.ReactElement[];
}) => {
  const { t } = useTranslation();
  return <BaseTrans ns="app" t={t} {...props} />;
};
