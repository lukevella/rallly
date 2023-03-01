import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Home from "@/components/home";

export default function Page() {
  return <Home />;
}

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
}) => {
  if (process.env.LANDING_PAGE) {
    if (process.env.LANDING_PAGE === "false") {
      return {
        redirect: {
          destination: "/new",
          permanent: false,
        },
      };
    }
    // if starts with /, it's a relative path
    if (process.env.LANDING_PAGE.startsWith("/")) {
      return {
        redirect: {
          destination: process.env.LANDING_PAGE,
          permanent: false,
        },
      };
    }
  }
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "homepage"])),
    },
  };
};
