import { NextSeo } from "next-seo";

import PageLayout from "@/components/layouts/page-layout";
import { getStaticTranslations } from "@/utils/page-translations";

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <NextSeo title="Privacy Policy" />
      <div className="prose mx-auto my-16 max-w-3xl rounded-lg bg-white p-8 shadow-md">
        <h1>Privacy Policy</h1>
        <p>Last updated: 1 August 2023</p>
        <p>
          At rallly.co, we take your privacy seriously. This privacy policy
          explains how we collect, use, and disclose your personal data, and
          your rights in relation to your personal data under the General Data
          Protection Regulation (GDPR).
        </p>

        <h2>Information we collect</h2>

        <p>
          We store personal data (names and email addresses) on
          DigitalOcean&apos;s servers, which are located in the United States.
          The reason for storing data in the US is to improve performance for
          users by having the data stored closer to where our compute services
          are running. By using our services, you acknowledge that your personal
          data may be transferred to and stored in the United States.
        </p>

        <p>
          We collect this information to enable the functionality of our
          website, and to provide support and communication to our users. We
          also use Posthog as a data processor to analyze trends and debug
          issues.
        </p>

        <p>
          Posthog collects certain properties automatically, such as device
          information and IP address, to help us understand how the website is
          being used and to identify and resolve any issues. This information is
          stored securely on Posthog&apos;s EU based servers and is used solely
          for the purpose of providing and improving the functionality of the
          website.
        </p>

        <h2>Legal basis for processing</h2>

        <p>
          We process your personal data on the legal bases of consent and
          contract. By using our website, you consent to the collection and use
          of your personal data as described in this privacy policy. We process
          your personal data to provide you with our services, and to fulfill
          our contractual obligations to you.
        </p>

        <h2>Retention of personal data</h2>

        <p>
          We retain your personal data only for as long as necessary to provide
          our services to you, and for as long as required by law. We will
          delete your personal data when you delete your account or when it is
          no longer necessary for the purposes for which it was collected.
        </p>

        <h2>Sharing of personal data</h2>

        <p>
          We do not share your personal data with any third parties for
          marketing or commercial purposes. We may share your personal data with
          third parties to provide you with our services, to comply with
          applicable laws and regulations, to respond to a subpoena, search
          warrant or other lawful request for information we receive, or to
          otherwise protect our rights.
        </p>

        <p>
          For example, we use Featurebase to make it easy for users to submit
          feedback. Your name and email may be shared with Featurbase to provide
          a seamless transition between the two services.
        </p>

        <h2>Your rights</h2>

        <p>You have the following rights in relation to your personal data:</p>

        <ul>
          <li>
            Right to access: You have the right to access the personal data we
            hold about you.
          </li>
          <li>
            Right to rectification: You have the right to have inaccurate
            personal data corrected or completed if it is incomplete.
          </li>
          <li>
            Right to erasure: You have the right to request that we delete your
            personal data.
          </li>
          <li>
            Right to restrict processing: You have the right to request that we
            restrict the processing of your personal data.
          </li>
          <li>
            Right to data portability: You have the right to receive the
            personal data we hold about you in a structured, commonly used, and
            machine-readable format, and to transmit it to another controller.
          </li>
          <li>
            Right to object: You have the right to object to the processing of
            your personal data in certain circumstances.
          </li>
        </ul>

        <p>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:support@rallly.co">support@rallly.co</a>.
        </p>

        <h2>Contact</h2>

        <p>
          If you have any questions or concerns about our privacy policy or our
          practices with regards to your personal data, please contact us at{" "}
          <a href="mailto:support@rallly.co">support@rallly.co</a>.
        </p>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;

export const getStaticProps = getStaticTranslations();
