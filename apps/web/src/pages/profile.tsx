import { withAuth, withSessionSsr } from "@rallly/backend/next";

import { getStandardLayout } from "../components/layouts/standard-layout";
import { Profile } from "../components/profile";
import { NextPageWithLayout } from "../types";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  return <Profile />;
};

Page.getLayout = getStandardLayout;

export const getServerSideProps = withSessionSsr([
  withAuth,
  withPageTranslations(["common", "app"]),
]);

export default Page;
