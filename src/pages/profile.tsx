import { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { withSessionSsr } from "@/utils/auth";

import { Profile } from "../components/profile";
import { withSession } from "../components/session";
import StandardLayout from "../components/standard-layout";

const Page: NextPage = () => {
  return (
    <StandardLayout>
      <Profile />
    </StandardLayout>
  );
};

export const getServerSideProps = withSessionSsr(
  async ({ locale = "en", query }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
        ...query,
      },
    };
  },
);

export default withSession(Page);
