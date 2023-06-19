import {
  composeGetServerSideProps,
  withSessionSsr,
} from "@rallly/backend/next";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPage<{ referer: string | null }> = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <AuthLayout>
      <Head>
        <title>{t("login")}</title>
      </Head>
      <LoginForm
        onAuthenticated={async () => {
          router.replace("/polls");
        }}
      />
    </AuthLayout>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  composeGetServerSideProps(async (ctx) => {
    if (ctx.req.session.user?.isGuest === false) {
      return {
        redirect: { destination: "/polls" },
        props: {},
      };
    }
    return { props: {} };
  }, withPageTranslations()),
);

export default Page;
