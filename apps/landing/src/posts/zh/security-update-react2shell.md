---
title: 安全更新：React2Shell
date: '2025-12-12'
category: Security
excerpt: 针对 React Server Components 漏洞（包括 React2Shell）的重要安全更新。自行托管的用户应立即更新。
---

**本公告仅适用于自行托管的 Rallly 安装。** 如果你使用的是 [rallly.co](https://rallly.co) 上托管的 Rallly 服务，则无需采取任何措施。服务器已在 CVE 公布后的数小时内完成修补，在此期间没有发生任何入侵。

---

React Server Components 中发现了一个影响 Rallly 的严重安全漏洞。在未修补的安装中，攻击者可能利用此漏洞在你的服务器上远程执行代码。如果你的实例可从互联网访问，且运行的不是最新版本，**你的服务器将面临重大风险**。

此漏洞为 [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)，也称为 [React2Shell](https://react2shell.com/)，会影响许多使用 React 19 构建的应用。已有报告称，现实中发生了多起入侵事件，攻击者在遭到入侵的服务器上部署了恶意软件。

此外，React Server Components（RSC）协议中还发现了另外两个漏洞（[CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183)、[CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)）。虽然这些漏洞无法用于远程执行代码，但仍需要安装修补程序。

React 团队后来发现，针对 CVE-2025-55184 的修复并不完整，因此需要额外的修补程序。该问题已被披露为 [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779)。

## 时间线

- **2025 年 12 月 3 日**：React 团队公布了 React2Shell（[CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)）
- **2025 年 12 月 4 日**：我发布了 v4.5.7（更新了 Next.js 软件包）
- **2025 年 12 月 8 日**：我发布了 v4.5.8（更新了 React 软件包，已完全防护 React2Shell）
- **2025 年 12 月 11 日**：React 团队公布了另外两个 CVE（[CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183)、[CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)）。作为回应，我发布了 v4.5.10
- **2025 年 12 月 12 日**：React 团队宣布针对 CVE-2025-55184 的修复并不完整。额外的修复已作为 [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) 披露。作为回应，我发布了 v4.5.11

## 需要采取的措施

如果你是自行托管 Rallly，请立即执行以下步骤：

- **将** Rallly **更新到最新版本**（v4.5.11 或更高版本），以防护所有四个 CVE。详情请参阅[版本发布说明](https://github.com/lukevella/rallly/releases/tag/v4.5.11)。
- 如果你使用的是 v4.5.10，则必须更新到 v4.5.11，因为之前的修复并不完整。
- 如果你使用的是 v4.5.8（该版本已完全防护 React2Shell），则必须更新到 v4.5.11，以防护所有漏洞。
- 如果你使用的是 v4.5.7，应更新到 v4.5.11，因为 v4.5.7 可能并未完全防护 React2Shell。
- 如果你使用的是 v4.5.7 之前的版本，则会受到 React2Shell 的影响，应立即更新。
- **重启**所有服务；如果使用 Docker，还应重新构建或拉取最新镜像。
- **如果无法立即更新**，请暂时限制访问（使用 VPN 或身份验证代理），直到完成修补。

更新后，请确认你的实例报告的是最新 Rallly 版本，并检查日志中是否存在任何警告。要检查版本，请访问：`<your‑rallly‑instance>/api/status`。

## 其他信息

如需了解全部四个漏洞的完整技术细节：
- [React2Shell（CVE-2025-55182）](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - 严重的远程代码执行漏洞
- [其他漏洞（CVE-2025-55183、CVE-2025-55184、CVE-2025-67779）](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - 拒绝服务和源代码泄露
