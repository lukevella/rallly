---
title: 安全性更新：React2Shell
date: '2025-12-12'
category: Security
excerpt: 重要安全性更新已修正包括 React2Shell 在內的 React Server Components 漏洞。自行託管的使用者應立即更新。
---
**本公告僅與自行託管的 Rallly 安裝有關。** 如果您使用的是 [rallly.co](https://rallly.co) 上的 Rallly 託管服務，則不需要採取任何行動。伺服器已在 CVE 公布後數小時內完成修補，這段期間沒有發生資料外洩事件。

---

React Server Components 發現了一個會影響 Rallly 的重大安全性漏洞。在未修補的安裝中，攻擊者可能會利用此漏洞在您的伺服器上遠端執行程式碼。如果您的執行個體可從網際網路存取，且未執行最新版本，**您的伺服器將面臨重大風險**。

此漏洞 [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)（也稱為 [React2Shell](https://react2shell.com/)）會影響許多使用 React 19 建置的應用程式。目前已有實際遭入侵的案例，攻擊者在遭入侵的伺服器上部署了惡意軟體。

此外，React Server Components（RSC）通訊協定中又發現了兩個漏洞（[CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183)、[CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)）。雖然這些漏洞無法讓攻擊者遠端執行程式碼，但仍需要進行修補。

React 團隊後來發現，CVE-2025-55184 的修正並不完整，因此需要額外的修補。此問題已揭露為 [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779)。

## 時間軸

- **2025 年 12 月 3 日**：React 團隊公布 React2Shell（[CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)）
- **2025 年 12 月 4 日**：我發布 v4.5.7（更新 Next.js 套件）
- **2025 年 12 月 8 日**：我發布 v4.5.8（更新 React 套件，已完整防護 React2Shell）
- **2025 年 12 月 11 日**：React 團隊公布另外兩個 CVE（[CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183)、[CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)）。我因此發布 v4.5.10
- **2025 年 12 月 12 日**：React 團隊宣布 CVE-2025-55184 的修正並不完整。額外的修正已揭露為 [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779)。我因此發布 v4.5.11

## 需要採取的行動

如果您是自行託管 Rallly，請立即採取以下步驟：

- **更新** Rallly 至最新版本（v4.5.11 或更新版本），以防護所有四個 CVE。如需詳細資訊，請參閱[版本資訊](https://github.com/lukevella/rallly/releases/tag/v4.5.11)。
- 如果您使用的是 v4.5.10，必須更新至 v4.5.11，因為先前的修正並不完整。
- 如果您使用的是 v4.5.8（已完整防護 React2Shell），必須更新至 v4.5.11，才能防護所有漏洞。
- 如果您使用的是 v4.5.7，應更新至 v4.5.11，因為 v4.5.7 可能未完整防護 React2Shell。
- 如果您使用的是早於 v4.5.7 的版本，則容易受到 React2Shell 攻擊，應立即更新。
- **重新啟動**所有服務；如果使用 Docker，請重新建置並提取最新映像檔。
- **如果無法立即更新**，請暫時限制存取權（使用 VPN 或驗證代理伺服器），直到完成修補。

更新後，請確認您的執行個體顯示最新的 Rallly 版本，並查看日誌是否有任何警告。若要查看版本，請前往：`<your‑rallly‑instance>/api/status`。

## 其他資訊

如需四個漏洞的完整技術詳細資訊：
- [React2Shell（CVE-2025-55182）](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)－重大遠端程式碼執行漏洞
- [其他漏洞（CVE-2025-55183、CVE-2025-55184、CVE-2025-67779）](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)－阻斷服務與原始碼外洩
