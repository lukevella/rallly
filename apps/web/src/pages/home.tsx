import { composeGetServerSideProps } from "@rallly/backend/next";
import { GetServerSideProps } from "next";

import Home from "@/components/home";
import { withPageTranslations } from "@/utils/with-page-translations";

export default function Page() {
  return <Home />;
}

export const getServerSideProps: GetServerSideProps = composeGetServerSideProps(
  async () => {
    // TODO (Luke Vella) [2023-03-14]: Remove this once we split the app from the landing page
    if (process.env.DISABLE_LANDING_PAGE === "true") {
      return { redirect: { destination: "/new", permanent: false } };
    }
    return { props: {} };
  },
  withPageTranslations(),
);
