import { withAuth, withSessionSsr } from "@rallly/backend/next";

import { getProfileLayout } from "@/components/layouts/profile-layout";
import Preferences from "@/components/preferences";
import { Trans } from "@/components/trans";

import { NextPageWithLayout } from "../types";
import { withPageTranslations } from "../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  return (
    <div className="divide-y">
      <div className="grid gap-4 p-3 md:grid-cols-6 md:gap-10 md:p-8">
        <div className="col-span-1 font-semibold tracking-tight">
          <Trans i18nKey="dateAndTime" defaults="Date & Time" />
        </div>
        <div className="col-span-5">
          <Preferences />
        </div>
      </div>
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getServerSideProps = withSessionSsr([
  withAuth,
  withPageTranslations(),
]);

export default Page;
