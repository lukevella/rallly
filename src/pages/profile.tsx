import { NextPage } from "next";

import { withSessionSsr } from "@/utils/auth";

import StandardLayout from "../components/layouts/standard-layout";
import { Profile } from "../components/profile";
import { withSession } from "../components/user-provider";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPage = () => {
  return (
    <StandardLayout>
      <Profile />
    </StandardLayout>
  );
};

export const getServerSideProps = withSessionSsr(async (ctx) => {
  if (ctx.req.session.user.isGuest !== false) {
    return {
      redirect: {
        destination: "/login",
      },
      props: {},
    };
  }
  return withPageTranslations(["common", "app"])(ctx);
});

export default withSession(Page);
