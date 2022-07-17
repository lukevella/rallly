import Head from "next/head";
import { useTranslation } from "next-i18next";
import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";
import PageLayout from "./page-layout";

const Home: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <PageLayout>
      <Head>
        <meta name="description" content={t("metaDescription")} />
        <title>{t("metaTitle")}</title>
      </Head>
      <Hero />
      <Features />
      <Bonus />
    </PageLayout>
  );
};

export default Home;
