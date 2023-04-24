import { withSessionSsr } from "@rallly/backend/next";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { AuthLayout } from "../components/auth/auth-layout";
import { RegisterForm } from "../components/auth/login-form";
import { withSession } from "../components/user-provider";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <AuthLayout>
      <Head>
        <title>{t("register")}</title>
      </Head>
      <RegisterForm
        onRegistered={() => {
          router.replace("/profile");
        }}
      />
    </AuthLayout>
  );
};

export const getServerSideProps = withSessionSsr(withPageTranslations());

export default withSession(Page);
