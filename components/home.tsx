import Head from "next/head";
import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";
import PageLayout from "./page-layout";

const Home: React.VoidFunctionComponent = () => {
  return (
    <PageLayout>
      <Head>
        <meta
          name="description"
          content="Create polls and vote to find the best day or time. A free alternative to Doodle."
        />
        <title>Rallly - Schedule group meetings</title>
      </Head>
      <Hero />
      <Features />
      <Bonus />
    </PageLayout>
  );
};

export default Home;
