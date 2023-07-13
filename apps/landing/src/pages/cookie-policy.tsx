import { GetStaticProps } from "next";
import { NextSeo } from "next-seo";

import PageLayout from "@/components/layouts/page-layout";
import { getStaticTranslations } from "@/utils/page-translations";

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <NextSeo title="Cookie Policy" />
      <div className="prose my-16 mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-md">
        <h1>Cookie Policy</h1>
        <p>Last updated: 19 April 2023</p>
        <p>
          This Policy explains how we use cookies and other similar technologies
          on our website, and your options to control them.
        </p>

        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files that are placed on your device (e.g.
          computer, tablet, or smartphone) when you visit a website. Cookies are
          widely used by website owners to make their websites work, or to work
          more efficiently, as well as to provide reporting information.
        </p>

        <h2>How we use cookies</h2>
        <p>
          We use only essential cookies on our website, which are necessary for
          our website to function properly and enable you to access secure areas
          of the website.
        </p>

        <h2>Your options</h2>
        <p>
          Most web browsers allow you to control cookies through their settings
          preferences. However, please be aware that disabling essential cookies
          may prevent you from accessing certain parts of our website.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes
          in our website or relevant regulations. We encourage you to review
          this policy regularly to stay informed about how we use cookies on our
          website.
        </p>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;

export const getStaticProps: GetStaticProps = getStaticTranslations();
