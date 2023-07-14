import { NextPage } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { AuthLayout } from "../components/auth/auth-layout";
import { RegisterForm } from "../components/auth/login-form";
import { getStaticTranslations } from "../utils/with-page-translations";

const Page: NextPage = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout>
      <Head>
        <title>{t("register")}</title>
      </Head>
      <RegisterForm />
    </AuthLayout>
  );
};

export const getStaticProps = getStaticTranslations;

export default Page;
