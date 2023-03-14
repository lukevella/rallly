import { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "react-i18next";

import CreatePoll from "@/components/create-poll";

import StandardLayout from "../components/layouts/standard-layout";
import { NextPageWithLayout } from "../types";
import { withAuthIfRequired, withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation("app");
  return (
    <>
      <Head>
        <title>{t("createNew")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CreatePoll />
    </>
  );
};

Page.getLayout = function getLayout(page) {
  return <StandardLayout>{page}</StandardLayout>;
};

export default Page;

export const getServerSideProps: GetServerSideProps = withSessionSsr([
  withAuthIfRequired,
  withPageTranslations(["common", "app"]),
]);
