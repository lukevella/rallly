---
title: 'Sicherheitsupdate: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Wichtige Sicherheitsupdates beheben Schwachstellen in React Server Components,
  einschließlich React2Shell. Betreiber selbst gehosteter Instanzen sollten
  sofort aktualisieren.
---

**Diese Ankündigung ist nur für selbst gehostete Rallly-Installationen relevant.** Wenn du den gehosteten Dienst von Rallly unter [rallly.co](https://rallly.co) verwendest, musst du nichts unternehmen. Die Server wurden innerhalb weniger Stunden nach Bekanntgabe der CVEs gepatcht, und in dieser Zeit kam es zu keinem Sicherheitsvorfall.

---

In React Server Components wurde eine kritische Sicherheitslücke entdeckt, die Rallly betrifft. Auf ungepatchten Installationen könnte diese Sicherheitslücke einem Angreifer ermöglichen, Code aus der Ferne auf deinem Server auszuführen. Wenn deine Instanz aus dem Internet erreichbar ist und du nicht die neueste Version verwendest, **ist dein Server erheblich gefährdet**.

Diese Sicherheitslücke, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (auch bekannt als [React2Shell](https://react2shell.com/)), betrifft viele Anwendungen, die mit React 19 erstellt wurden. Es gibt bereits Berichte über Sicherheitsvorfälle in der Praxis, bei denen Angreifer Schadsoftware auf kompromittierten Servern installiert haben.

Darüber hinaus wurden zwei weitere Sicherheitslücken ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) im React-Server-Components-Protokoll (RSC) entdeckt. Diese ermöglichen zwar keine Remote-Code-Ausführung, müssen aber trotzdem gepatcht werden.

Das React-Team stellte später fest, dass die Behebung von CVE-2025-55184 unvollständig war und ein zusätzlicher Patch erforderlich ist. Diese zusätzliche Sicherheitslücke wurde als [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) veröffentlicht.

## Zeitlicher Ablauf

- **3. Dezember 2025**: React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) wurde vom React-Team angekündigt
- **4. Dezember 2025**: Ich veröffentlichte v4.5.7 (aktualisiertes Next.js-Paket)
- **8. Dezember 2025**: Ich veröffentlichte v4.5.8 (aktualisiertes React-Paket, vollständig gegen React2Shell geschützt)
- **11. Dezember 2025**: Zwei weitere CVEs ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) wurden vom React-Team angekündigt. Als Reaktion veröffentlichte ich v4.5.10
- **12. Dezember 2025**: Das React-Team gab bekannt, dass die Behebung von CVE-2025-55184 unvollständig war. Die zusätzliche Sicherheitslücke wurde als [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) veröffentlicht. Als Reaktion veröffentlichte ich v4.5.11

## Erforderliche Maßnahmen

Wenn du Rallly selbst hostest, führe bitte sofort die folgenden Schritte durch:

- **Aktualisiere** Rallly auf die neueste Version (v4.5.11 oder höher), um gegen alle vier CVEs geschützt zu sein. Einzelheiten findest du in den [Versionshinweisen](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Wenn du v4.5.10 verwendest, musst du auf v4.5.11 aktualisieren, da die vorherige Behebung unvollständig war.
- Wenn du v4.5.8 verwendest (diese Version war vollständig gegen React2Shell geschützt), musst du auf v4.5.11 aktualisieren, um gegen alle Sicherheitslücken geschützt zu sein.
- Wenn du v4.5.7 verwendest, solltest du auf v4.5.11 aktualisieren, da v4.5.7 möglicherweise keinen vollständigen Schutz gegen React2Shell bot.
- Wenn du eine Version vor v4.5.7 verwendest, bist du durch React2Shell gefährdet und solltest sofort aktualisieren.
- **Starte** alle Dienste neu und erstelle bei Verwendung von Docker das neueste Image neu bzw. lade es herunter.
- **Wenn du nicht sofort aktualisieren kannst**, beschränke den Zugriff vorübergehend (VPN/Auth-Proxy), bis die Patches installiert sind.

Überprüfe nach der Aktualisierung, dass deine Instanz die neueste Rallly-Version meldet, und sieh die Protokolle auf Warnungen durch. Um die Version zu überprüfen, rufe folgende Adresse auf: `<your‑rallly‑instance>/api/status`.

## Weitere Informationen

Ausführliche technische Informationen zu allen vier Sicherheitslücken findest du hier:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – Kritische Sicherheitslücke zur Remote-Code-Ausführung
- [Weitere Sicherheitslücken (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – Denial-of-Service und Offenlegung von Quellcode
