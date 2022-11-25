import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";
import PageLayout from "./page-layout";

const Home: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <PageLayout>
      <NextSeo
        title={t("metaTitle")}
        description={t("metaDescription")}
        twitter={{
          handle: "@imlukevella",
          site: "@ralllyco",
          cardType: "summary_large_image",
        }}
      />
      <Hero />
      <Features />
      <Bonus />
    </PageLayout>
  );
};

export default Home;
