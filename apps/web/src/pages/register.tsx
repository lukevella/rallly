import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { StandardLayout } from "@/components/layouts/standard-layout";
import { NextPageWithLayout } from "@/types";

import { RegisterForm } from "../components/auth/auth-forms";
import { AuthLayout } from "../components/auth/auth-layout";
import { getStaticTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const router = useRouter();
  return (
    <AuthLayout>
      <Head>
        <title>{t("register")}</title>
      </Head>
      <RegisterForm
        onRegistered={() => {
          router.replace("/");
        }}
      />
    </AuthLayout>
  );
};

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export const getStaticProps = getStaticTranslations;

export default Page;
