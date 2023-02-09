import { withSessionSsr } from "@/utils/auth";

import { getStandardLayout } from "../components/layouts/standard-layout";
import { Profile } from "../components/profile";
import { NextPageWithLayout } from "../types";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  return <Profile />;
};

Page.getLayout = getStandardLayout;

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

export default Page;
