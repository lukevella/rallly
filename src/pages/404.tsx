import { GetStaticProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

import ErrorPage from "@/components/error-page";
import DocumentSearch from "@/components/icons/document-search.svg";

const Custom404: NextPage = () => {
  const { t } = useTranslation("errors");
  return <div>404</div>;
};

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["errors"])),
    },
  };
};

export default Custom404;
