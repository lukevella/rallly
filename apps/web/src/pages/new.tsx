import { withAuthIfRequired, withSessionSsr } from "@rallly/backend/next";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import CreatePoll from "@/components/create-poll";
import { getStandardLayout } from "@/components/layouts/standard-layout";

import { NextPageWithLayout } from "../types";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>{t("newPoll")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CreatePoll />
    </>
  );
};

Page.getLayout = getStandardLayout;

export default Page;

export const getServerSideProps: GetServerSideProps = withSessionSsr([
  withAuthIfRequired,
  withPageTranslations(),
]);
