"use client";
import { Trans as BaseTrans, useTranslation } from "react-i18next";

import type { TxKeyPath } from "../i18n/types";

export const Trans = (
  props: React.ComponentProps<typeof BaseTrans> & { i18nKey: TxKeyPath },
) => {
  const { t } = useTranslation();
  return <BaseTrans ns="app" t={t} {...props} />;
};
