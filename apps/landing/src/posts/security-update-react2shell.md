---
title: "Security Update: React2Shell"
date: "2025-12-12"
excerpt: Important security updates addressing React Server Components vulnerabilities including React2Shell. Self-hosters should update immediately.
---

**This announcement is only relevant to self-hosted Rallly installations.** If you use Rallly's hosted service at [rallly.co](https://rallly.co), you do not need to take any action. Our servers were patched within hours of the CVEs being announced, and there was no breach of our servers during that time.

---

A critical security vulnerability has been discovered in React Server Components that affects Rallly. On unpatched installations, this vulnerability could allow an attacker to execute code remotely on your server. If your instance is accessible from the internet and you are not running the latest release, **your server is at significant risk**.

This vulnerability, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (also known as [React2Shell](https://react2shell.com/)), affects many applications built with React 19. There have already been reports of real-world breaches where attackers deployed malicious software on compromised servers.

Additionally, two additional vulnerabilities ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) have been identified in the React Server Components (RSC) protocol. While these do not allow for Remote Code Execution, they still require patching.

## Timeline

- **December 3, 2024**: React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) was announced and patched in v4.5.8
- **December 11, 2024**: Two additional CVEs ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) were announced and are patched in v4.5.10

## Action Required

If you are self-hosting Rallly, please take the following steps immediately:

- **Update** Rallly to the latest version (v4.5.10 or later) to be protected against all three CVEs. See the [release notes](https://github.com/lukevella/rallly/releases/tag/v4.5.10) for details.
- If you are on v4.5.8 (which patched React2Shell), you must update to v4.5.10 to be protected against the two additional vulnerabilities.
- If you are on a version prior to v4.5.8, you are vulnerable to React2Shell and should update immediately.
- **Restart** all services and, if using Docker, rebuild/pull the latest image.
- **If you cannot update right away**, temporarily restrict access (VPN/auth proxy) until patched.

After updating, verify your instance reports the latest Rallly version and review logs for any warnings. To check the version, visit: `<your‑rallly‑instance>/api/status`.

## Additional Information

For full technical details about all three vulnerabilities:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Critical Remote Code Execution vulnerability
- [Additional vulnerabilities (CVE-2025-55183, CVE-2025-55184)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Denial of Service and Source Code Exposure
