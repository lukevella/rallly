"use cache";

import { cacheLife } from "next/cache";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { Section } from "@/components/section";
import { LinkBase } from "@/i18n/client/link";

export default async function PrivacyPolicy() {
  cacheLife("max");
  return (
    <Section>
      <LegalPageLayout title="Privacy policy" lastUpdated="2026-09-26">
        <p>
          At rallly.co, we take your privacy seriously. This privacy policy
          explains how we collect, use, and disclose your personal data, and
          your rights in relation to your personal data under the General Data
          Protection Regulation (GDPR).
        </p>

        <h2>Information we collect</h2>

        <p>
          We store personal data (names and email addresses) in a database
          hosted by Neon on servers located in the United States. We also use
          Upstash to store session data and rate limiting data in the United
          States. The reason for storing data in the US is to improve
          performance for users by having the data stored closer to where our
          compute services are running. By using our services, you acknowledge
          that your personal data may be transferred to and stored in the United
          States.
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

        <p>
          If you have an account, your analytics profile in Posthog is keyed to
          your account and carries your name and email address. We keep the
          email address there so that, when you contact us about a problem, we
          can find your account&apos;s activity and work out what went wrong. It
          is not written into individual analytics events, is not used for
          marketing, and is erased from Posthog when you delete your account.
          When you create an account, the pages you visited on our website
          beforehand are linked to your profile so we can tell which pages lead
          people to Rallly.
        </p>

        <h2>Optional information about your work</h2>

        <p>
          If you set up an account for work, we ask for two further pieces of
          information about you:
        </p>

        <ul>
          <li>
            Your role — self-declared, chosen from a list or described in your
            own words.
          </li>
          <li>
            The sector your organisation works in — suggested by us, and yours
            to confirm or change.
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

        <h2>Google user data</h2>

        <p>
          If you sign in with Google, we receive your name, email address and
          profile picture to create and identify your account.
        </p>

        <p>
          If you connect Google Meet, Rallly uses the permission to create Meet
          meeting spaces (<code>meetings.space.created</code>) only to create a
          meeting space in your account when you finalize a poll that uses
          Google Meet as its video call. We store the meeting link and meeting
          code on the event, so they can be included in the calendar invite and
          confirmation emails sent to you and your participants. Rallly does not
          read, list or change any other meetings, and does not join or record
          meetings.
        </p>

        <p>
          When you connect, Google also shares your Google account id, email
          address and basic profile (name and profile picture). We do not store
          your name or profile picture. We store your Google account id and
          email address to identify the connection and show which account is
          connected, and the OAuth tokens Google issues, encrypted at rest, so
          Rallly can create meetings without asking you to sign in each time. We
          use this data only to identify the connected account and to create
          meetings for you as the organizer. We do not sell Google user data,
          use it for advertising, use it to train AI models, or share it with
          third parties except as needed to provide the service.
        </p>

        <p>
          When you disconnect Google Meet in your settings, we delete the stored
          account details and tokens. When you delete your Rallly account, we
          delete them along with your events, including the details of meetings
          Rallly created. You can also revoke Rallly&apos;s access at any time
          at{" "}
          <a href="https://myaccount.google.com/permissions">
            myaccount.google.com/permissions
          </a>
          . Meetings Rallly already created stay in your Google account.
        </p>

        <p>
          Rallly&apos;s use and transfer of information received from Google
          APIs to any other app will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. This applies to all Google
          user data Rallly receives, whatever permission it was received under.
        </p>

        <h2>Zoom user data</h2>

        <p>
          If you connect Zoom, Rallly uses the permissions you approve only to
          read your Zoom user id, name and email address, and to create a
          meeting on your Zoom account when you finalize a poll that uses Zoom
          as its video call. Rallly does not read your existing meetings,
          recordings, contacts or chat, and does not join or record meetings.
        </p>

        <p>
          We do not store your name. We store your Zoom user id and email
          address to identify the connection and show which account is
          connected, and the access and refresh tokens Zoom issues, encrypted at
          rest, so Rallly can create meetings without asking you to sign in each
          time. For each meeting Rallly creates, we store its meeting id, join
          link and passcode on the event, so they can be included in the
          calendar invite and confirmation emails sent to you and your
          participants.
        </p>

        <p>
          We use this data only to identify the connected account and to create
          meetings for you as the organizer. We do not sell Zoom user data, use
          it for advertising, use it to train AI models, or share it with third
          parties except as needed to provide the service.
        </p>

        <p>
          When you disconnect Zoom in your settings, we delete the stored
          account details and tokens and ask Zoom to revoke Rallly&apos;s
          access. If you remove Rallly from your Zoom account in the Zoom App
          Marketplace, Zoom notifies us and we delete them. When you delete your
          Rallly account, we delete them along with your events, including the
          details of meetings Rallly created. Meetings Rallly already created
          stay in your Zoom account.
        </p>

        <h2>Content moderation</h2>

        <p>
          To protect other people from fraud and scams, we scan the title,
          description and location of every poll for patterns associated with
          abuse. Content that matches a pattern is sent to OpenAI for automated
          classification. We send only the content itself, not your name, email
          address or any other account data, although the content may contain
          personal data if you typed it there. OpenAI does not use content sent
          through its API to train its models and retains it for up to 30 days
          for abuse monitoring.
        </p>

        <p>
          Content that the automated check flags may be reviewed by our staff,
          together with the account that submitted it, before we decide whether
          to remove it or suspend the account.
        </p>

        <h2>Legal basis for processing</h2>

        <p>
          We process your personal data on the legal bases of consent and
          contract. By using our website, you consent to the collection and use
          of your personal data as described in this privacy policy. We process
          your personal data to provide you with our services, and to fulfill
          our contractual obligations to you.
        </p>

        <p>
          Your role and your organisation&apos;s sector are processed on the
          basis of consent alone, since they are optional and are not needed to
          deliver the service. You give that consent by submitting the setup
          form with a value in either field — including a suggested sector you
          choose to leave as it is. Choosing &quot;Prefer not to say&quot;, or
          leaving a field unanswered, gives no consent and stores nothing. You
          can withdraw consent at any time by asking us to erase the answer.
        </p>

        <p>
          We keep your name and email address on your analytics profile on the
          basis of our legitimate interest in providing support and diagnosing
          faults: without them we cannot connect a support request to the
          activity that caused it. You can object to this processing at any time
          by contacting us at the address below, and we will remove those
          details from your analytics profile.
        </p>

        <p>
          We scan and classify poll content on the basis of our legitimate
          interest in preventing the service from being used for fraud, scams
          and other abuse against the people who receive poll invitations.
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
          We rely on the following service providers to operate rallly.co, each
          of which may process personal data for the purpose described:
        </p>

        <ul>
          <li>Vercel — application hosting (United States)</li>
          <li>Neon — managed PostgreSQL database (United States)</li>
          <li>Upstash — session data and rate limiting (United States)</li>
          <li>
            Amazon Web Services — transactional email and object storage (United
            States)
          </li>
          <li>
            Stripe — payment processing, billing contact data only (United
            States)
          </li>
          <li>
            OpenAI — automated content moderation of flagged poll content
            (United States)
          </li>
          <li>PostHog — product analytics (European Union)</li>
          <li>Sentry — error monitoring (United States)</li>
        </ul>

        <p>
          The same providers are listed, with transfer mechanisms, in the
          Sub-processor annex of our{" "}
          <LinkBase href="/dpa">Data Processing Agreement</LinkBase>.
        </p>

        <p>
          We also use Featurebase to make it easy for users to submit feedback.
          Your name and email may be shared with Featurebase to provide a
          seamless transition between the two services.
        </p>

        <h2>Processing on behalf of organizations</h2>

        <p>
          Where we process personal data on behalf of an organization using
          Rallly, for example the details of people invited to that
          organization&apos;s polls and events, we act as a processor and that
          processing is governed by our{" "}
          <LinkBase href="/dpa">Data Processing Agreement</LinkBase>.
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
      </LegalPageLayout>
    </Section>
  );
}

export async function generateMetadata() {
  cacheLife("max");
  return {
    title: "Privacy Policy",
    description: "The privacy policy for Rallly.",
  };
}
