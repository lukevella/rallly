import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
export { default } from "@/components/support";

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  try {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["homepage", "support"])),
      },
    };
  } catch {
    return { notFound: true };
  }
};
