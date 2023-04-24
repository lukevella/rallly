import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";
import PageLayout from "./layouts/page-layout";

const Home: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <NextSeo
        title={t("homepage.metaTitle")}
        description={t("homepage.metaDescription")}
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
