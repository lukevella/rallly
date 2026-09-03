"use cache";

import { cacheLife } from "next/cache";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { Section } from "@/components/section";

export default async function CookiePolicy() {
  cacheLife("max");
  return (
    <Section>
      <LegalPageLayout title="Cookie policy" lastUpdated="2026-09-03">
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
        <p>We use the following types of cookies on our website:</p>
        <h3>Essential cookies</h3>
        <p>
          These cookies are necessary for our website to function properly and
          enable you to access secure areas of the website. They cannot be
          disabled.
        </p>
        <h3>Attribution cookies</h3>
        <p>
          When you open the app from a link on this website, we set a cookie
          named <code>rallly_ref</code> (and, where applicable,{" "}
          <code>rallly_cta</code>) that records which page and button you came
          from. It exists only so we can tell which pages lead people to sign
          up. It is set by us, not by a third party, expires after 30 days, is
          read once if you create an account, and is not shared with anyone.
        </p>

        <h2>Analytics</h2>
        <p>
          We use PostHog for product analytics. PostHog does not set cookies and
          does not store anything on your device. Users who are signed in are
          recognised through their account. Visitors who are not signed in are
          counted using a hash derived from IP address and browser that changes
          every day and cannot be used to identify anyone. The data collected
          includes pages visited, events triggered, and device type. It is
          stored on PostHog&apos;s servers in the EU and is not used for
          advertising or shared with third parties.
        </p>

        <h2>Your options</h2>
        <p>
          Most web browsers allow you to control cookies through their settings
          preferences. Please be aware that disabling essential cookies may
          prevent you from accessing certain parts of our website.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes
          in our website or relevant regulations. We encourage you to review
          this policy regularly to stay informed about how we use cookies on our
          website.
        </p>
      </LegalPageLayout>
    </Section>
  );
}

export async function generateMetadata() {
  cacheLife("max");
  return {
    title: "Rallly: Cookie Policy",
    description: "The cookie policy for Rallly.",
  };
}
