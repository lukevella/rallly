"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Section } from "@/components/section";
import { LinkBase } from "@/i18n/client/link";

export default async function DataProcessingAgreement() {
  cacheLife("max");
  return (
    <Section>
      <h1 className="max-w-2xl text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-4xl">
        Data processing agreement
      </h1>
      <p className="mt-4 text-gray-500 text-sm">Last updated: 29 August 2026</p>
      <div className="longform mt-8 max-w-2xl">
        <p>
          This Data Processing Agreement (&quot;DPA&quot;) forms part of the{" "}
          <LinkBase href="/terms-of-use">Terms of Use</LinkBase> between Stack
          Snap Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) and the
          customer (&quot;you&quot;, &quot;your&quot;) and governs our
          processing of personal data on your behalf when we provide the hosted
          Rallly service at rallly.co.
        </p>
        <p>
          This DPA is incorporated into the Terms of Use by reference and
          applies automatically. No signature is required for it to take effect.
          If your procurement process requires a signed copy, email{" "}
          <a href="mailto:support@rallly.co">support@rallly.co</a> and we will
          countersign an execution copy of this DPA.
        </p>

        <hr />

        <h2>1. Definitions</h2>
        <p>1.1 In this DPA:</p>
        <ul>
          <li>
            <strong>&quot;Data Protection Laws&quot;</strong> means all laws
            applicable to the processing of personal data under this DPA,
            including the UK GDPR and the Data Protection Act 2018, and, where
            applicable, the EU GDPR (Regulation (EU) 2016/679).
          </li>
          <li>
            <strong>&quot;Service&quot;</strong> means the hosted Rallly service
            at rallly.co.
          </li>
          <li>
            <strong>&quot;Customer Data&quot;</strong> means personal data that
            we process on your behalf in providing the Service.
          </li>
          <li>
            <strong>&quot;Sub-processor&quot;</strong> means a third party
            engaged by us to process Customer Data.
          </li>
          <li>
            <strong>
              &quot;Personal data&quot;, &quot;processing&quot;,
              &quot;controller&quot;, &quot;processor&quot;, &quot;data
              subject&quot;
            </strong>{" "}
            and <strong>&quot;personal data breach&quot;</strong> have the
            meanings given to them in Data Protection Laws.
          </li>
        </ul>

        <hr />

        <h2>2. Roles and scope</h2>
        <p>
          2.1 For Customer Data, you are the controller and we are the
          processor. Where you act as a processor for another organization, we
          act as your sub-processor and you warrant that your instructions to us
          are authorized by the relevant controller.
        </p>
        <p>
          2.2 We act as an independent controller, not as your processor, for
          personal data we process for our own purposes: managing accounts and
          billing, securing and improving the Service, and communicating with
          users. That processing is described in our{" "}
          <LinkBase href="/privacy-policy">Privacy Policy</LinkBase>.
        </p>
        <p>
          2.3 This DPA applies for as long as we process Customer Data. If there
          is a conflict between this DPA and the Terms of Use, this DPA controls
          with respect to the processing of personal data.
        </p>

        <hr />

        <h2>3. Details of processing</h2>
        <ul>
          <li>
            <strong>Subject matter:</strong> provision of the Service, which
            lets you create and manage scheduling polls and related events.
          </li>
          <li>
            <strong>Duration:</strong> the term of your use of the Service, plus
            the deletion period in Section 9.
          </li>
          <li>
            <strong>Nature and purpose:</strong> hosting, storage, transmission,
            and display of scheduling data in order to find meeting times and
            manage events on your behalf.
          </li>
          <li>
            <strong>Categories of data subjects:</strong> your account holders
            and members; poll participants and invitees; any other individuals
            whose personal data you or your users submit to the Service.
          </li>
          <li>
            <strong>Categories of personal data:</strong> names; email
            addresses; timezone and language preferences; availability responses
            and votes; comments; optional profile and organization details;
            technical data such as IP addresses and device information generated
            by use of the Service.
          </li>
          <li>
            <strong>Special categories:</strong> none. The Service does not
            require special category data and you agree not to submit it.
          </li>
        </ul>

        <hr />

        <h2>4. Our obligations as processor</h2>
        <p>We will:</p>
        <ul>
          <li>
            (a) process Customer Data only on your documented instructions,
            including with regard to transfers to third countries, unless
            required to do otherwise by law, in which case we will inform you of
            that legal requirement before processing unless the law prohibits
            it. Your documented instructions are the Terms of Use, this DPA, and
            the configuration and use of the Service by you and your users. We
            will inform you if, in our opinion, an instruction infringes Data
            Protection Laws;
          </li>
          <li>
            (b) ensure that all persons authorized to process Customer Data are
            bound by contractual or statutory obligations of confidentiality;
          </li>
          <li>
            (c) implement and maintain the technical and organizational measures
            set out in Annex 1, taking into account the requirements of Article
            32 of the GDPR. We may update those measures from time to time,
            provided the update does not materially reduce the level of
            protection;
          </li>
          <li>(d) engage Sub-processors only as set out in Section 6;</li>
          <li>
            (e) taking into account the nature of the processing, assist you by
            appropriate technical and organizational measures, insofar as this
            is possible, in fulfilling your obligation to respond to data
            subject requests. The Service includes self-service tools for
            access, correction, and deletion; where those tools are
            insufficient, we will assist on request;
          </li>
          <li>
            (f) assist you in ensuring compliance with your obligations under
            Articles 32 to 36 of the GDPR (security, breach notification, data
            protection impact assessments, and prior consultation), taking into
            account the nature of the processing and the information available
            to us;
          </li>
          <li>
            (g) at your choice, delete or return Customer Data at the end of the
            provision of the Service, as set out in Section 9;
          </li>
          <li>
            (h) make available to you all information necessary to demonstrate
            compliance with Article 28 of the GDPR and allow for and contribute
            to audits as set out in Section 8.
          </li>
        </ul>

        <hr />

        <h2>5. Personal data breach</h2>
        <p>
          5.1 We will notify you without undue delay, and in any event within 72
          hours, after becoming aware of a personal data breach affecting
          Customer Data. To the extent the information is available to us, the
          notification will describe the nature of the breach, the categories
          and approximate number of data subjects and records concerned, the
          likely consequences, the measures taken or proposed to address the
          breach, and a contact point for further information.
        </p>
        <p>
          5.2 We will document personal data breaches and cooperate with you in
          remediation and in meeting your own notification obligations.
        </p>

        <hr />

        <h2>6. Sub-processors</h2>
        <p>
          6.1 You provide a general written authorization for us to engage the
          Sub-processors listed in Annex 2 and to add or replace Sub-processors
          in accordance with this Section.
        </p>
        <p>
          6.2 We will impose data protection obligations on each Sub-processor
          by written contract that are no less protective than those in this
          DPA, and we remain fully liable to you for the performance of each
          Sub-processor&apos;s obligations.
        </p>
        <p>
          6.3 We will update Annex 2 on this page at least 30 days before a new
          or replacement Sub-processor first processes Customer Data. To receive
          Sub-processor change notices by email, send a request to{" "}
          <a href="mailto:support@rallly.co">support@rallly.co</a> with
          &quot;Subprocessor notifications&quot; in the subject line and we will
          notify the address you provide of future changes.
        </p>
        <p>
          6.4 You may object to a new or replacement Sub-processor on reasonable
          data protection grounds by notifying us within 30 days of the notice.
          We will work with you in good faith to find an alternative. If no
          alternative is reasonably available, you may terminate your
          subscription for the affected Service and we will refund any prepaid
          fees covering the remainder of the term after the date of termination.
        </p>

        <hr />

        <h2>7. International transfers</h2>
        <p>
          7.1 Customer Data is processed in the locations listed in Annex 2,
          which include the United States and the European Union.
        </p>
        <p>
          7.2 Where Customer Data protected by UK or EU Data Protection Laws is
          transferred to a country that has not received an adequacy decision,
          we ensure appropriate safeguards under Article 46 of the GDPR: the
          relevant Sub-processor is certified under the EU-US Data Privacy
          Framework (including the UK Extension), or the transfer is governed by
          the applicable Standard Contractual Clauses or the UK International
          Data Transfer Addendum. The mechanism relied on for each Sub-processor
          is listed in Annex 2.
        </p>

        <hr />

        <h2>8. Audits and information</h2>
        <p>
          8.1 We will make available to you the information reasonably necessary
          to demonstrate compliance with this DPA. We support this primarily
          through documentation: this DPA, our{" "}
          <LinkBase href="/security">security page</LinkBase>, our publicly
          auditable source code, our public real-time status page, and the audit
          reports and certifications of our Sub-processors, which are available
          from each provider.
        </p>
        <p>
          8.2 Where that documentation is not sufficient to demonstrate
          compliance, you, or an independent auditor appointed by you that is
          not a competitor of ours, may audit our compliance with this DPA no
          more than once in any 12-month period, on at least 30 days written
          notice, during normal business hours, without disrupting our
          operations, subject to reasonable confidentiality obligations, and at
          your own cost.
        </p>

        <hr />

        <h2>9. Deletion and return</h2>
        <p>
          9.1 On request, we will provide you with a copy of Customer Data in a
          structured, commonly used, machine-readable format.
        </p>
        <p>
          9.2 Deleting a poll through the Service deletes the associated
          Customer Data. Account deletion starts a 7 day recovery window, after
          which the data is permanently erased. On written request at the end of
          the provision of the Service, we will delete all remaining Customer
          Data and confirm deletion in writing, unless applicable law requires
          us to retain it.
        </p>
        <p>
          9.3 Residual copies of deleted Customer Data in encrypted backups
          expire on our database provider&apos;s retention schedule and in any
          event within 35 days of deletion.
        </p>
        <p>
          9.4 Short-lived copies of Customer Data used in access-restricted
          preview environments are deleted automatically no later than 7 days
          after they are created.
        </p>

        <hr />

        <h2>10. Liability</h2>
        <p>
          Each party&apos;s liability under or in connection with this DPA is
          subject to the limitations and exclusions of liability in the Terms of
          Use, except to the extent liability cannot be limited under Data
          Protection Laws.
        </p>

        <hr />

        <h2>11. Governing law</h2>
        <p>
          This DPA is governed by the laws of England and Wales, and the courts
          of England and Wales have exclusive jurisdiction over any dispute
          arising from it.
        </p>

        <hr />

        <h2>Annex 1: Technical and organizational measures</h2>
        <p>
          The measures below describe how we protect Customer Data. Further
          detail is published on our{" "}
          <LinkBase href="/security">security page</LinkBase>.
        </p>
        <ul>
          <li>
            <strong>Encryption:</strong> TLS 1.2 or higher for all data in
            transit, AES-256 encryption at rest, and HTTPS enforced across the
            platform.
          </li>
          <li>
            <strong>Access control:</strong> access to production systems is
            limited to authorized personnel on a need-to-know basis and
            protected by strong authentication. The Service itself uses email
            verification codes, Google, or Microsoft sign-in, so we store no
            user passwords.
          </li>
          <li>
            <strong>Tenant isolation:</strong> Customer Data is scoped to its
            owner at the access layer, with the architecture rules enforced by
            static analysis in the codebase.
          </li>
          <li>
            <strong>Application security:</strong> all inputs are schema
            validated, database access goes through a typed ORM with
            parameterized queries, and dependencies are monitored for
            vulnerabilities with automated security updates.
          </li>
          <li>
            <strong>Change management:</strong> every production change goes
            through version control, code review, automated tests, and staged
            deployment with instant rollback.
          </li>
          <li>
            <strong>Availability and resilience:</strong> the production
            database is backed up continuously with point-in-time recovery. The
            application runs on globally distributed serverless infrastructure
            and can be redeployed rapidly. Uptime is published in real time on
            an independent status page.
          </li>
          <li>
            <strong>Monitoring and incident response:</strong> monitoring and
            alerting route directly to the engineering team, and personal data
            breaches are handled as set out in Section 5.
          </li>
          <li>
            <strong>Data minimization and lifecycle:</strong> we collect the
            minimum data needed to run the Service, support self-service
            deletion and export, and automatically schedule inactive polls for
            deletion with advance notice and a grace period.
          </li>
          <li>
            <strong>Organizational measures:</strong> all persons with access to
            Customer Data are bound by confidentiality obligations, our
            infrastructure providers hold SOC 2 Type 2 and/or ISO 27001
            certifications, and the full source code of the Service is public
            and auditable.
          </li>
        </ul>

        <hr />

        <h2>Annex 2: Sub-processors</h2>
        <p>
          We use the following Sub-processors to provide the Service. Changes to
          this list are notified as set out in Section 6.
        </p>
        <div className="overflow-x-auto">
          <table className="whitespace-nowrap lg:whitespace-normal">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Location</th>
                <th>Transfer mechanism</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <a
                    href="https://vercel.com/security"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Vercel
                  </a>
                </td>
                <td>Application hosting</td>
                <td>United States</td>
                <td>EU-US DPF + UK Extension (SCCs fallback)</td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://neon.com/security"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Neon
                  </a>
                </td>
                <td>Managed PostgreSQL database</td>
                <td>United States</td>
                <td>
                  EU-US DPF + UK Extension, certified under Databricks, Inc.
                  (SCCs fallback)
                </td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://upstash.com/docs/common/help/compliance"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Upstash
                  </a>
                </td>
                <td>Session data, rate limiting</td>
                <td>United States</td>
                <td>EU-US DPF + UK Extension (SCCs + UK Addendum fallback)</td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://aws.amazon.com/compliance/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Amazon Web Services
                  </a>
                </td>
                <td>Transactional email, object storage</td>
                <td>United States</td>
                <td>
                  EU-US DPF + UK Extension, certified under Amazon.com, Inc.
                  (SCCs fallback)
                </td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://stripe.com/docs/security"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Stripe
                  </a>
                </td>
                <td>Payment processing (billing contact data only)</td>
                <td>United States</td>
                <td>EU-US DPF + UK Extension (SCCs + UK Addendum fallback)</td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://posthog.com/privacy"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    PostHog (EU)
                  </a>
                </td>
                <td>Product analytics</td>
                <td>European Union</td>
                <td>EU data residency (no US transfer)</td>
              </tr>
              <tr>
                <td>
                  <a
                    href="https://sentry.io/security/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Sentry
                  </a>
                </td>
                <td>Error monitoring</td>
                <td>United States</td>
                <td>EU-US DPF + UK Extension (SCCs + UK Addendum fallback)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Stripe, PostHog, and Sentry primarily support processing for which we
          act as a controller (billing, product analytics, and error monitoring)
          and are included above for transparency. For payment transactions,
          Stripe acts as an independent controller under its own terms.
        </p>

        <hr />

        <h2>Contact</h2>
        <p>
          Questions about this DPA, requests for a countersigned copy, and
          Sub-processor notification requests can be sent to{" "}
          <a href="mailto:support@rallly.co">support@rallly.co</a>.
        </p>
        <p>
          <strong>Post:</strong>
          <br />
          Stack Snap Ltd.
          <br />
          The Gallery
          <br />
          14 Upland Road
          <br />
          London SE22 9EE
          <br />
          United Kingdom
        </p>
      </div>
    </Section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  cacheLife("max");
  return {
    title: "Rallly: Data Processing Agreement",
    description:
      "The GDPR Article 28 Data Processing Agreement for the hosted Rallly service, including technical and organizational measures and the subprocessor list.",
  };
}
