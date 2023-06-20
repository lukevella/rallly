import { FileSearchIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import React from "react";

import ErrorPage from "@/components/error-page";
import { getStandardLayout } from "@/components/layouts/standard-layout";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

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

Custom404.getLayout = getStandardLayout;

export const getStaticProps = withPageTranslations();

export default Custom404;
