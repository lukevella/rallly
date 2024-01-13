import { FileSearchIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import React from "react";

import ErrorPage from "@/components/error-page";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const Custom404: NextPageWithLayout = () => {
  const { t } = useTranslation();
  return (
    <ErrorPage
      icon={FileSearchIcon}
      title={t("errors_notFoundTitle")}
      description={t("errors_notFoundDescription")}
    />
  );
};

export const getStaticProps = getStaticTranslations;

export default Custom404;
