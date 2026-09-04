"use cache";

import { buttonVariants, cn } from "@rallly/ui";
import {
  ActivityIcon,
  ArrowRightIcon,
  CodeIcon,
  DatabaseIcon,
  EyeOffIcon,
  LockIcon,
  ServerIcon,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Image from "next/image";
import {
  ContentGrid,
  ContentGridDescription,
  ContentGridItem,
  ContentGridLink,
  ContentGridTitle,
} from "@/components/content-grid";
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
import { LinkBase } from "@/i18n/client/link";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

const unitedStates = { flag: "🇺🇸", label: "United States" };
const europeanUnion = { flag: "🇪🇺", label: "European Union" };

// Logo heights are tuned per wordmark so they sit at the same visual weight;
// the brightness filter flattens every logo to one tone until hovered
const providers = [
  {
    name: "Vercel",
    href: "https://vercel.com/security",
    purpose: "Application hosting",
    location: unitedStates,
    logo: {
      src: "/static/images/partners/vercel.svg",
      width: 4438,
      height: 1000,
      className: "h-5",
    },
  },
  {
    name: "Neon",
    href: "https://neon.com/security",
    purpose: "Managed PostgreSQL database",
    location: unitedStates,
    logo: {
      src: "/static/images/partners/neon.svg",
      width: 157,
      height: 45,
      className: "h-6",
    },
  },
  {
    name: "Upstash",
    href: "https://upstash.com/docs/common/help/compliance",
    purpose: "Session data, rate limiting",
    location: unitedStates,
    logo: {
      src: "/static/images/partners/upstash.svg",
      width: 1631,
      height: 472,
      className: "h-7",
    },
  },
  {
    name: "Amazon Web Services",
    href: "https://aws.amazon.com/compliance/",
    purpose: "Transactional email, object storage",
    location: unitedStates,
    logo: {
      src: "/static/images/partners/aws.svg",
      width: 304,
      height: 182,
      className: "h-9",
    },
  },
  {
    name: "Stripe",
    href: "https://stripe.com/docs/security",
    purpose: "Payment processing",
    location: unitedStates,
    logo: {
      src: "/static/images/partners/stripe.svg",
      width: 360,
      height: 150,
      className: "h-8",
    },
  },
  {
    name: "PostHog",
    href: "https://posthog.com/privacy",
    purpose: "Product analytics",
    location: europeanUnion,
    logo: {
      src: "/static/images/partners/posthog.svg",
      width: 160,
      height: 28,
      className: "h-6",
    },
  },
];

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
            Rallly is built in the open. The source code is public, uptime is
            independently measured, and every provider that touches your data is
            listed openly.
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          <ContentGrid>
            <ContentGridItem>
              <ContentGridTitle>
                <CodeIcon /> Open source
              </ContentGridTitle>
              <ContentGridDescription>
                The full source code is public and auditable on GitHub. Anyone
                can review exactly how data is handled.
              </ContentGridDescription>
              <ContentGridLink href="https://github.com/lukevella/rallly">
                Browse source code
              </ContentGridLink>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <ActivityIcon /> Verified uptime
              </ContentGridTitle>
              <ContentGridDescription>
                Measured uptime above 99.9%, published in real time on an
                independent status page. Not self-reported.
              </ContentGridDescription>
              <ContentGridLink href="https://rallly.openstatus.dev">
                View live status
              </ContentGridLink>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <ServerIcon /> Self-hostable
              </ContentGridTitle>
              <ContentGridDescription>
                Prefer full control? Run Rallly on your own infrastructure and
                your data never reaches us.
              </ContentGridDescription>
              <ContentGridLink href="https://support.rallly.co/self-hosting/introduction">
                Learn more
              </ContentGridLink>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <LockIcon /> Encryption everywhere
              </ContentGridTitle>
              <ContentGridDescription>
                TLS 1.2 or higher for all traffic, AES-256 encryption at rest,
                and HTTPS enforced across the platform.
              </ContentGridDescription>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <EyeOffIcon /> Privacy-first
              </ContentGridTitle>
              <ContentGridDescription>
                We collect the minimum needed to run the service. No sensitive
                personal information, no advertising trackers, and we never sell
                data.
              </ContentGridDescription>
            </ContentGridItem>
            <ContentGridItem>
              <ContentGridTitle>
                <DatabaseIcon /> Tenant isolation
              </ContentGridTitle>
              <ContentGridDescription>
                Data is scoped to its owner at the access layer, with the
                architecture rules enforced by static analysis in the codebase.
              </ContentGridDescription>
            </ContentGridItem>
          </ContentGrid>
        </SectionContent>
      </Section>
      <Section>
        <SectionHeading>
          <SectionTitle>Standing on the shoulders of giants</SectionTitle>
          <SectionDescription>
            Rallly runs on the world&apos;s leading infrastructure providers,
            giving you the security and performance you should expect. Here is
            where your data lives.
          </SectionDescription>
        </SectionHeading>
        <SectionContent>
          {/* Tiles carry a top and left border; the wrapper clips the outer
              edge so only the inner grid lines remain */}
          <div className="overflow-hidden">
            <ul className="-mt-px -ml-px grid grid-cols-2 sm:grid-cols-3">
              {providers.map((provider) => (
                <li
                  key={provider.name}
                  className="flex flex-col gap-y-4 border-t border-l p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-x-4">
                    <a
                      href={provider.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex h-9 items-center rounded-sm"
                    >
                      <Image
                        src={provider.logo.src}
                        width={provider.logo.width}
                        height={provider.logo.height}
                        alt={provider.name}
                        className={cn(
                          "w-auto opacity-60 brightness-0 transition hover:opacity-100 hover:brightness-100",
                          provider.logo.className,
                        )}
                      />
                    </a>
                    <span
                      role="img"
                      aria-label={provider.location.label}
                      className="text-base leading-none"
                    >
                      {provider.location.flag}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{provider.purpose}</p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 max-w-prose text-pretty text-gray-500 text-sm">
            Every provider is bound by a data processing agreement, with EU-US
            Data Privacy Framework certification or Standard Contractual Clauses
            covering international transfers.
          </p>
          <LinkBase
            href="/dpa#annex-2"
            className="group mt-2 inline-flex items-center gap-x-1 font-medium text-primary text-sm hover:underline"
          >
            See the full subprocessor list in Annex 2 of our DPA
            <ArrowRightIcon
              className="size-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </LinkBase>
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
              deletion in writing.
            </FaqItem>
            <FaqItem question="Do you hold SOC 2 or ISO 27001 certification?">
              Not currently. Our infrastructure providers are SOC 2 Type 2
              and/or ISO 27001 certified, and their attestations are available
              from each provider. In place of certification we offer what most
              certified vendors cannot: fully auditable source code, public
              real-time uptime monitoring, and direct access to the people who
              build the product.
            </FaqItem>
            <FaqItem question="Do you offer a Data Processing Agreement (DPA)?">
              Yes. Our GDPR Article 28{" "}
              <LinkBase className="text-primary hover:underline" href="/dpa">
                Data Processing Agreement
              </LinkBase>{" "}
              is published openly and incorporated into our terms of use, so it
              applies automatically without paperwork. It includes our technical
              and organizational measures and the full subprocessor list, and we
              countersign an execution copy on request.
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
              The production database is backed up continuously with
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
