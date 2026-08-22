"use cache";

import { cacheLife } from "next/cache";

export default async function PrivacyPolicy() {
  cacheLife("max");
  return (
    <div className="prose mx-auto max-w-3xl">
      <h1>Privacy Policy</h1>
      <p>Last updated: 21 August 2026</p>
      <p>
        At rallly.co, we take your privacy seriously. This privacy policy
        explains how we collect, use, and disclose your personal data, and your
        rights in relation to your personal data under the General Data
        Protection Regulation (GDPR).
      </p>

      <h2>Information we collect</h2>

      <p>
        We store personal data (names and email addresses) on Neon&apos;s
        servers, which are located in the United States. The reason for storing
        data in the US is to improve performance for users by having the data
        stored closer to where our compute services are running. By using our
        services, you acknowledge that your personal data may be transferred to
        and stored in the United States.
      </p>

      <p>
        We collect this information to enable the functionality of our website,
        and to provide support and communication to our users. We also use
        Posthog as a data processor to analyze trends and debug issues.
      </p>

      <p>
        Posthog collects certain properties automatically, such as device
        information and IP address, to help us understand how the website is
        being used and to identify and resolve any issues. This information is
        stored securely on Posthog&apos;s EU based servers and is used solely
        for the purpose of providing and improving the functionality of the
        website.
      </p>

      <h2>Optional information about your work</h2>

      <p>
        If you set up an account for work, we ask for two further pieces of
        information about you:
      </p>

      <ul>
        <li>
          Your role — self-declared, chosen from a list or described in your own
          words.
        </li>
        <li>
          The sector your organisation works in — suggested by us, and yours to
          confirm or change.
        </li>
      </ul>

      <p>
        We use this to understand which professional groups use Rallly, so we
        can improve the product for them and focus our documentation and
        marketing on the people it is written for. This information is also
        shared with Posthog, our analytics processor, for the same purpose.
      </p>

      <p>
        The sector field is suggested for you: we guess it from your email
        address&apos;s domain and the organisation name you enter, so that the
        field arrives filled in rather than blank. The guess is only a
        suggestion. Nothing is recorded until you submit the form, and you can
        change it to any other option, or to &quot;Prefer not to say&quot;,
        before you do.
      </p>

      <p>
        Both fields are optional. You can skip either one when setting up your
        account, and neither is required to use Rallly — skipping them has no
        effect on the service you receive. To change or remove an answer you
        have already given, email us at{" "}
        <a href="mailto:support@rallly.co">support@rallly.co</a> and we will
        update or erase it.
      </p>

      <h2>Legal basis for processing</h2>

      <p>
        We process your personal data on the legal bases of consent and
        contract. By using our website, you consent to the collection and use of
        your personal data as described in this privacy policy. We process your
        personal data to provide you with our services, and to fulfill our
        contractual obligations to you.
      </p>

      <p>
        Your role and your organisation&apos;s sector are processed on the basis
        of consent alone, since they are optional and are not needed to deliver
        the service. You give that consent by submitting the setup form with a
        value in either field — including a suggested sector you choose to leave
        as it is. Choosing &quot;Prefer not to say&quot;, or leaving a field
        unanswered, gives no consent and stores nothing. You can withdraw
        consent at any time by asking us to erase the answer.
      </p>

      <h2>Retention of personal data</h2>

      <p>
        We retain your personal data only for as long as necessary to provide
        our services to you, and for as long as required by law. We will delete
        your personal data when you delete your account or when it is no longer
        necessary for the purposes for which it was collected.
      </p>

      <h2>Sharing of personal data</h2>

      <p>
        We do not share your personal data with any third parties for marketing
        or commercial purposes. We may share your personal data with third
        parties to provide you with our services, to comply with applicable laws
        and regulations, to respond to a subpoena, search warrant or other
        lawful request for information we receive, or to otherwise protect our
        rights.
      </p>

      <p>
        For example, we use Featurebase to make it easy for users to submit
        feedback. Your name and email may be shared with Featurbase to provide a
        seamless transition between the two services.
      </p>

      <h2>Your rights</h2>

      <p>You have the following rights in relation to your personal data:</p>

      <ul>
        <li>
          Right to access: You have the right to access the personal data we
          hold about you.
        </li>
        <li>
          Right to rectification: You have the right to have inaccurate personal
          data corrected or completed if it is incomplete.
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
          Right to data portability: You have the right to receive the personal
          data we hold about you in a structured, commonly used, and
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
  );
}

export async function generateMetadata() {
  cacheLife("max");
  return {
    title: "Rallly: Privacy Policy",
    description: "The privacy policy for Rallly.",
  };
}
