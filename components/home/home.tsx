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
      <div className="bg-gradient-to-b from-transparent via-white to-white">
        <Features />
      </div>
      <div className="bg-gradient-to-b from-white via-white to-transparent pb-16">
        <Bonus />
      </div>
    </PageLayout>
  );
};

export default Home;
