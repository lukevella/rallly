import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { useUser, withSession } from "@/components/user-provider";

import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPage<{ referer: string | null }> = () => {
  const { t } = useTranslation("app");
  const router = useRouter();
  const { refresh } = useUser();

  return (
    <AuthLayout>
      <Head>
        <title>{t("login")}</title>
      </Head>
      <LoginForm
        onAuthenticated={async () => {
          refresh();
          router.replace("/profile");
        }}
      />
    </AuthLayout>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async (ctx) => {
    if (ctx.req.session.user?.isGuest === false) {
      return {
        redirect: { destination: "/profile" },
        props: {},
      };
    }

    return await withPageTranslations(["common", "app"])(ctx);
  },
);

export default withSession(Page);
