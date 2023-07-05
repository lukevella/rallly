import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";

const Home: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-24">
      <NextSeo
        title={t("homepage_metaTitle")}
        description={t("homepage_metaDescription")}
        twitter={{
          handle: "@imlukevella",
          site: "@ralllyco",
          cardType: "summary_large_image",
        }}
      />
      <Hero />
      <Features />
      <Bonus />
    </div>
  );
};

export default Home;
