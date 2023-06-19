import { NextSeo } from "next-seo";

import PageLayout from "@/components/layouts/page-layout";
import { getStaticTranslations } from "@/utils/page-translations";

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <NextSeo title="Terms of Use" />
      <div className="prose my-16 mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-md">
        <h1>Terms of Use</h1>
        <p>Last updated: 15 June 2023</p>
        <p>
          Welcome to rallly.co, an open-source project provided under the AGPLv3
          license. By accessing and using this website, you agree to comply with
          and be bound by the following terms of use. If you do not agree to
          these terms, please do not use this website.
        </p>

        <h2>1. Use of Website</h2>
        <p>
          You may use this website only for lawful purposes and in accordance
          with these terms of use. You must not use this website in any way that
          causes or may cause damage to the website or impairment of the
          availability or accessibility of the website. You must not use this
          website in any way that is unlawful, fraudulent, or harmful.
        </p>

        <h2>2. Limitation of Liability</h2>
        <p>
          We will not be liable for any damages arising from the use or
          inability to use this website, including but not limited to direct,
          indirect, incidental, consequential, or punitive damages.
        </p>

        <h2>3. No Refund Policy</h2>
        <p>
          All purchases and transactions made through this website are final and
          non-refundable. We do not provide refunds for any reason. By making a
          purchase or engaging in a transaction on this website, you acknowledge
          and agree to our no refund policy.
        </p>

        <h2>4. Links to Third-Party Websites</h2>
        <p>
          This website may contain links to third-party websites that are not
          owned or controlled by rallly.co. We have no control over, and assume
          no responsibility for, the content, privacy policies, or practices of
          any third-party websites.
        </p>

        <h2>5. Modifications to Terms of Use</h2>
        <p>
          We reserve the right to modify these terms of use at any time, without
          prior notice to you. Your continued use of this website after any
          modifications to these terms of use will constitute your acceptance of
          such modifications.
        </p>

        <p>
          If you have any questions about these terms of use, please contact us
          at <a href="mailto:support@rallly.co">support@rallly.co</a>.
        </p>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;

export const getStaticProps = getStaticTranslations;
