import { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "react-i18next";

import CreatePoll from "@/components/create-poll";

import { withSession } from "../components/user-provider";
import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

const Page = () => {
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
export default withSession(Page);

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app"]),
);
