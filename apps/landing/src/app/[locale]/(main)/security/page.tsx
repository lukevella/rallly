"use cache";

import { buttonVariants } from "@rallly/ui";
import {
  ActivityIcon,
  ArrowRightIcon,
  DatabaseIcon,
  EyeOffIcon,
  LockIcon,
  ServerIcon,
} from "lucide-react";
import { cacheLife } from "next/cache";
import GithubIcon from "@/assets/github.svg";
import { PeopleBadge, PollsBadge } from "@/components/home/animated-number";
import { Faq, FaqItem } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

function SecurityFeature({
  icon,
  title,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  link?: { label: React.ReactNode; href: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-x-2.5 font-medium text-base text-gray-800">
        <span className="text-gray-500">{icon}</span>
        {title}
      </h3>
      <p className="mt-2 text-pretty text-gray-500 text-sm leading-relaxed">
        {children}
      </p>
      {link ? (
        <a
          className="group mt-2 inline-flex items-center gap-x-1 font-medium text-primary text-sm hover:underline"
          href={link.href}
        >
          {link.label}
          <ArrowRightIcon
            className="size-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      ) : null}
    </div>
  );
}

function TransferMechanismCell({
  href,
  fallback,
  children,
}: {
  href: string;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <td>
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
      <div className="mt-0.5 text-gray-500 text-xs">{fallback}</div>
    </td>
  );
}

export default async function Security(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("hours");
  const { locale } = await props.params;
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  const format = new Intl.NumberFormat(locale);
  return (
    <div className="divide-y">
      <Section>
        <Hero
          className="max-w-2xl"
          title="Securely scheduling for thousands of organizations"
          description="Every part of Rallly is built to protect your data, on trusted infrastructure with a codebase anyone can audit. Your schedule is nobody's business but yours."
        />
        <Stats className="mx-0 mt-8 text-left sm:mt-24">
          <PeopleBadge locale={locale} live>
            {format.format(voterCount)} people
          </PeopleBadge>{" "}
          voted on{" "}
          <PollsBadge locale={locale} live>
            {format.format(pollCount)} polls
          </PollsBadge>{" "}
          in the last 30 days
        </Stats>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>Secure by design</SectionTitle>
          <SectionDescription>
            How we run the service, where your data lives, and what we commit
            to. Where most vendors ask you to take their word for it, we publish
            the evidence.
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            <SecurityFeature
              icon={<GithubIcon className="size-4" />}
              title="Open source"
              link={{
                label: "Browse source code",
                href: "https://github.com/lukevella/rallly",
              }}
            >
              The full source code is public and auditable on GitHub. Anyone can
              review exactly how data is handled.
            </SecurityFeature>
            <SecurityFeature
              icon={<ActivityIcon className="size-4" />}
              title="Verified uptime"
              link={{
                label: "View live status",
                href: "https://rallly.openstatus.dev",
              }}
            >
              Measured uptime above 99.9%, published in real time on an
              independent status page. Not self-reported.
            </SecurityFeature>
            <SecurityFeature
              icon={<ServerIcon className="size-4" />}
              title="Self-hostable"
              link={{
                label: "Learn more",
                href: "https://support.rallly.co/self-hosting/introduction",
              }}
            >
              Prefer full control? Run Rallly on your own infrastructure and
              your data never reaches us.
            </SecurityFeature>
            <SecurityFeature
              icon={<LockIcon className="size-4" />}
              title="Encryption everywhere"
            >
              TLS 1.2 or higher for all traffic, AES-256 encryption at rest, and
              HTTPS enforced across the platform.
            </SecurityFeature>
            <SecurityFeature
              icon={<EyeOffIcon className="size-4" />}
              title="Privacy-first"
            >
              We collect the minimum needed to run the service. No sensitive
              personal information, no advertising trackers, and we never sell
              data.
            </SecurityFeature>
            <SecurityFeature
              icon={<DatabaseIcon className="size-4" />}
              title="Tenant isolation"
            >
              Data is scoped to its owner at the access layer, with the
              architecture rules enforced by static analysis in the codebase.
            </SecurityFeature>
          </div>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>Standing on the shoulders of giants</SectionTitle>
          <SectionDescription>
            Rallly runs on the world&apos;s leading infrastructure providers,
            giving you the security and performance you should expect. Here is
            the complete list, and where your data lives.
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <div className="longform overflow-x-auto">
            {/* Below lg the table is wider than the viewport: keep cells on
                one line and let the wrapper scroll instead of wrapping */}
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
                      className="text-gray-800 hover:underline"
                      href="https://vercel.com/security"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Vercel
                    </a>
                  </td>
                  <td>Application hosting</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://vercel.com/legal/dpa"
                    fallback="SCCs fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://www.digitalocean.com/trust"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      DigitalOcean
                    </a>
                  </td>
                  <td>Managed PostgreSQL database</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://www.digitalocean.com/legal/data-processing-agreement"
                    fallback="SCCs + UK Addendum fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://upstash.com/docs/common/help/compliance"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Upstash
                    </a>
                  </td>
                  <td>Session data, rate limiting</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://upstash.com/trust/dpa.pdf"
                    fallback="SCCs + UK Addendum fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://aws.amazon.com/compliance/"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Amazon Web Services
                    </a>
                  </td>
                  <td>Transactional email, object storage</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://d1.awsstatic.com/legal/aws-gdpr/AWS_GDPR_DPA.pdf"
                    fallback="Certified under Amazon.com, Inc. · SCCs fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://stripe.com/docs/security"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Stripe
                    </a>
                  </td>
                  <td>Payment processing (billing contact data only)</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://stripe.com/legal/dpa"
                    fallback="SCCs + UK Addendum fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://posthog.com/privacy"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      PostHog (EU)
                    </a>
                  </td>
                  <td>Product analytics</td>
                  <td>European Union</td>
                  <TransferMechanismCell
                    href="https://posthog.com/privacy"
                    fallback="No US transfer"
                  >
                    EU data residency
                  </TransferMechanismCell>
                </tr>
                <tr>
                  <td>
                    <a
                      className="text-gray-800 hover:underline"
                      href="https://sentry.io/security/"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Sentry
                    </a>
                  </td>
                  <td>Error monitoring</td>
                  <td>United States</td>
                  <TransferMechanismCell
                    href="https://sentry.io/legal/dpa/"
                    fallback="SCCs + UK Addendum fallback"
                  >
                    EU-US DPF + UK Extension
                  </TransferMechanismCell>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>Frequently asked questions</SectionTitle>
          <SectionDescription>
            The answers we give when organizations evaluate Rallly. If your
            review needs something not covered here, we are happy to complete
            your security questionnaire.
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <Faq>
            <FaqItem question="What personal data do you collect?">
              Very little by design. Account holders provide a name, email
              address, and timezone preference. Poll participants provide a name
              and optionally an email address, and vote as guests without
              needing accounts. We collect no sensitive personal information, no
              government identifiers, and no financial account details.
            </FaqItem>
            <FaqItem question="How long do you keep data, and can we delete it?">
              Data is retained while your account is active. You can delete
              polls and your account at any time. Account deletion starts a 7
              day recovery window, after which your data is permanently erased
              and remaining backup copies expire on our database provider&apos;s
              retention schedule. Inactive polls are automatically scheduled for
              deletion with a 30 day grace period and advance notice. On
              request, we delete an organization&apos;s data and confirm
              deletion in writing, and we provide an export of your data.
            </FaqItem>
            <FaqItem question="Do you hold SOC 2 or ISO 27001 certification?">
              Not currently. Our infrastructure providers are SOC 2 Type 2
              and/or ISO 27001 certified, and their attestations are available
              from each provider. In place of certification we offer what most
              certified vendors cannot: fully auditable source code, public
              real-time uptime monitoring, and direct access to the people who
              build the product.
            </FaqItem>
            <FaqItem question="How is the application secured?">
              Sign in works with email verification codes, Google, or Microsoft
              accounts. All inputs are schema-validated, database access goes
              through a typed ORM with parameterized queries, and dependencies
              are monitored for vulnerabilities with automated security updates.
              Every production change goes through version control, code review,
              automated tests, and staged deployment with instant rollback.
            </FaqItem>
            <FaqItem question="What happens if there is a security incident?">
              Monitoring and alerting route directly to the engineering team. If
              a security incident affects your data, we will notify you within
              72 hours of becoming aware of it. Rallly has had no data breaches.
            </FaqItem>
            <FaqItem question="Do you support single sign-on?">
              Members can sign in with their Google or Microsoft accounts today.
              Organization-wide SSO enforcement is on our roadmap as part of
              upcoming organization features.
            </FaqItem>
            <FaqItem question="How do you handle backups and recovery?">
              The production database is backed up automatically every day with
              point-in-time recovery, managed by our database provider. The
              application runs on globally distributed serverless infrastructure
              and can be redeployed rapidly.
            </FaqItem>
            <FaqItem question="Can you complete our vendor security questionnaire?">
              Yes. We complete security and privacy questionnaires for
              organizational customers, and most answers map directly to the
              information on this page. Send it to{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:support@rallly.co"
              >
                support@rallly.co
              </a>
              .
            </FaqItem>
          </Faq>
        </SectionContent>
      </Section>
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <h2 className="text-balance font-medium text-2xl text-gray-800 leading-tight tracking-tight sm:text-4xl">
            Evaluating Rallly for your organization?
          </h2>
          <p className="max-w-prose text-pretty text-base/6 text-gray-500 sm:text-lg">
            We are happy to answer questions, complete your security review, or
            talk through deployment options, including self-hosting on your own
            infrastructure.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            className={buttonVariants({ size: "lg", variant: "primary" })}
            href="mailto:support@rallly.co"
          >
            Contact us
          </a>
        </div>
      </Section>
    </div>
  );
}

export async function generateMetadata() {
  cacheLife("max");
  return {
    title: "Rallly: Security",
    description:
      "How Rallly runs its service, where your data lives, and what we commit to.",
  };
}
