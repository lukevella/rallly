# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Rallly, please report it
privately. **Do not open a public GitHub issue.**

- Use GitHub's private vulnerability reporting: go to the **Security**
  tab of this repository and click **Report a vulnerability**.
- Or email support@rallly.co.

Please include enough detail to reproduce the issue: affected version
or commit, steps, and impact.

## Supported Versions

Only the latest release receives security fixes. Please reproduce on
the latest version before reporting.

## Scope

This policy covers the Rallly source code in this repository.

Testing must be done against **your own local or self-hosted
deployment**. Do **not** test against rallly.co, app.rallly.co, or any hosted instance
you do not own — this affects other users and is not authorized.

Issues in third-party services used by rallly.co (Stripe, PostHog, the
hosting provider, etc.) are out of scope here. Report those to the
respective vendor.

For self-hosted deployments, securing the environment is the operator's
responsibility. Exposed secrets, weak `SECRET_PASSWORD` values, public
databases, and similar misconfigurations are not Rallly vulnerabilities.

## Out of Scope

The following are generally not treated as actionable vulnerabilities:

- Reports from automated scanners without a demonstrated, exploitable issue
- Clickjacking on pages with no sensitive actions
- Login/logout/unauthenticated CSRF without a concrete account-takeover path
- Attacks requiring MITM or physical access to a device
- Attacks requiring social engineering
- Denial of service / resource exhaustion
- Email spoofing, missing SPF/DKIM/DMARC
- Missing security headers (CSP, HSTS, etc.) without a concrete exploit
- Rate limiting on non-sensitive endpoints
- Version disclosure
- User/email enumeration
- Self-XSS

## Safe Harbor

No legal action will be pursued against good-faith security research
that follows this policy. If in doubt about whether something is in
scope, ask first.

## Guidelines

- Don't access, modify, or delete data that isn't yours.
- Don't exfiltrate more data than needed to demonstrate the issue.
- Allow reasonable time to address the issue before public disclosure
  (typically 90 days). If you intend to publish (blog, talk, writeup),
  please share a draft beforehand so a fix can be confirmed.

## Response

Rallly is a small open-source project. Reports will be acknowledged as
soon as reasonably possible, with status updates as work progresses.
Valid reporters will be credited unless you prefer otherwise.
