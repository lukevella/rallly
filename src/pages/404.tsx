import { NextPage } from "next";
import useTranslation from "next-translate/useTranslation";
import React from "react";

import ErrorPage from "@/components/error-page";
import DocumentSearch from "@/components/icons/document-search.svg";

const Custom404: NextPage = () => {
  const { t } = useTranslation("errors");
  return (
    <ErrorPage
      icon={DocumentSearch}
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
};

export default Custom404;
