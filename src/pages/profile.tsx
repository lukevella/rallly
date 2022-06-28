import { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { withSessionSsr } from "@/utils/auth";

import { Profile } from "../components/profile";
import { SessionProvider, UserSessionData } from "../components/session";
import StandardLayout from "../components/standard-layout";

const Page: NextPage<{ user: UserSessionData }> = ({ user }) => {
  const name = user.isGuest ? user.id : user.name;
  return (
    <SessionProvider defaultUser={user}>
      <Head>
        <title>Profile - {name}</title>
      </Head>
      <StandardLayout>
        <Profile />
      </StandardLayout>
    </SessionProvider>
  );
};

export const getServerSideProps = withSessionSsr(
  async ({ locale = "en", query, req }) => {
    if (!req.session.user || req.session.user.isGuest) {
      return { redirect: { destination: "/new" }, props: {} };
    }
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
        ...query,
        user: req.session.user,
      },
    };
  },
);

export default Page;
