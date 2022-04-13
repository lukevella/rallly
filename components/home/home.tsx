import Head from "next/head";
import React from "react";
import PageLayout from "../page-layout";
import Bonus from "./bonus";
import Features from "./features";
import Hero from "./hero";

const Home: React.VoidFunctionComponent = () => {
  return (
    <PageLayout>
      <Head>
        <title>Rallly - Schedule group meetings</title>
      </Head>
      <Hero />
      <Features />
      <Bonus />
    </PageLayout>
  );
};

export default Home;
