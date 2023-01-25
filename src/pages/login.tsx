import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { useUser, withSession } from "@/components/user-provider";

import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPage<{ referer: string | null }> = ({ referer }) => {
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
          await refresh();
          router.replace(referer ?? "/profile");
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
        props: {
          referer: (ctx.query.redirect as string) ?? null,
        },
      };
    }

    return await withPageTranslations(["common", "app"])(ctx);
  },
);

export default withSession(Page);
