import { FileSearchIcon } from "@rallly/icons";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

import ErrorPage from "@/components/error-page";
import { NextPageWithLayout } from "@/types";

const Custom404: NextPageWithLayout = () => {
  const { t } = useTranslation();
  return (
    <ErrorPage
      icon={FileSearchIcon}
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
};

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

export default Custom404;
