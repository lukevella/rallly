import Head from "next/head";
import { useTranslation } from "next-i18next";

import { LoginForm } from "@/components/auth/auth-forms";
import { AuthLayout } from "@/components/auth/auth-layout";
import { StandardLayout } from "@/components/layouts/standard-layout";
import { NextPageWithLayout } from "@/types";

import { getStaticTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout<{ referer: string | null }> = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("login")}</title>
      </Head>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
};

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export default Page;

export const getStaticProps = getStaticTranslations;
