import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export { default } from "@/components/home";

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  console.log(locale);
  try {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["common", "homepage"])),
      },
    };
  } catch {
    return { notFound: true };
  }
};
