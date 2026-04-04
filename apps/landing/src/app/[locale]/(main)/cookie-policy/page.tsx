export default function CookiePolicy() {
  return (
    <div className="prose mx-auto max-w-3xl">
      <h1>Cookie Policy</h1>
      <p>Last updated: 4 April 2026</p>
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
      <h3>Analytics cookies</h3>
      <p>
        We use PostHog to collect anonymous analytics data that helps us
        understand how visitors use our website and identify areas for
        improvement. PostHog sets cookies to distinguish between users and
        sessions. The data collected includes pages visited, events triggered,
        device type, and IP address (used for approximate geolocation only).
        This information is stored on PostHog&apos;s EU-based servers and is not
        used for advertising or shared with third parties.
      </p>

      <h2>Your options</h2>
      <p>
        Most web browsers allow you to control cookies through their settings
        preferences. You can also opt out of analytics cookies by enabling the{" "}
        <a href="https://globalprivacycontrol.org/" rel="noopener noreferrer">
          Global Privacy Control
        </a>{" "}
        signal in your browser. Please be aware that disabling essential cookies
        may prevent you from accessing certain parts of our website.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in
        our website or relevant regulations. We encourage you to review this
        policy regularly to stay informed about how we use cookies on our
        website.
      </p>
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "Rallly: Cookie Policy",
    description: "The cookie policy for Rallly.",
  };
}
