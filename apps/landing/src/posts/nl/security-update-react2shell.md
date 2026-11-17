---
title: 'Beveiligingsupdate: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Belangrijke beveiligingsupdates voor kwetsbaarheden in React Server
  Components, waaronder React2Shell. Beheerders van zelfgehoste installaties
  moeten onmiddellijk updaten.
---

**Deze aankondiging is alleen relevant voor zelfgehoste Rallly-installaties.** Als je de gehoste service van Rallly gebruikt op [rallly.co](https://rallly.co), hoef je niets te doen. De servers zijn binnen enkele uren nadat de CVE's waren aangekondigd gepatcht en in die periode heeft er geen datalek plaatsgevonden.

---

Er is een kritieke beveiligingskwetsbaarheid ontdekt in React Server Components die gevolgen heeft voor Rallly. Op installaties waarop de patch niet is toegepast, kan een aanvaller door deze kwetsbaarheid op afstand code uitvoeren op je server. Als je instantie vanaf het internet toegankelijk is en je niet de nieuwste versie gebruikt, **loopt je server een aanzienlijk risico**.

Deze kwetsbaarheid, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (ook bekend als [React2Shell](https://react2shell.com/)), treft veel applicaties die zijn gebouwd met React 19. Er zijn al meldingen van daadwerkelijke beveiligingsinbreuken waarbij aanvallers schadelijke software op gecompromitteerde servers hebben geïnstalleerd.

Daarnaast zijn er twee extra kwetsbaarheden ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) vastgesteld in het React Server Components-protocol (RSC). Hoewel deze geen uitvoering van code op afstand mogelijk maken, moeten hiervoor nog steeds patches worden geïnstalleerd.

Het React-team ontdekte later dat de oplossing voor CVE-2025-55184 onvolledig was, waardoor een extra patch nodig was. Dit is openbaar gemaakt als [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Tijdlijn

- **3 december 2025**: React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) werd aangekondigd door het React-team
- **4 december 2025**: Ik publiceerde v4.5.7 (bijgewerkt Next.js-pakket)
- **8 december 2025**: Ik publiceerde v4.5.8 (bijgewerkt React-pakket, volledig beschermd tegen React2Shell)
- **11 december 2025**: Twee extra CVE's ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) werden aangekondigd door het React-team. Als reactie hierop publiceerde ik v4.5.10
- **12 december 2025**: Het React-team kondigde aan dat de oplossing voor CVE-2025-55184 onvolledig was. De aanvullende oplossing is openbaar gemaakt als [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Als reactie hierop publiceerde ik v4.5.11

## Actie vereist

Als je Rallly zelf host, voer dan onmiddellijk de volgende stappen uit:

- **Update** Rallly naar de nieuwste versie (v4.5.11 of later) om beschermd te zijn tegen alle vier de CVE's. Bekijk de [release notes](https://github.com/lukevella/rallly/releases/tag/v4.5.11) voor meer informatie.
- Als je v4.5.10 gebruikt, moet je updaten naar v4.5.11, omdat de vorige oplossing onvolledig was.
- Als je v4.5.8 gebruikt (die volledig beschermde tegen React2Shell), moet je updaten naar v4.5.11 om beschermd te zijn tegen alle kwetsbaarheden.
- Als je v4.5.7 gebruikt, moet je updaten naar v4.5.11, omdat v4.5.7 mogelijk niet volledig beschermde tegen React2Shell.
- Als je een versie ouder dan v4.5.7 gebruikt, ben je kwetsbaar voor React2Shell en moet je onmiddellijk updaten.
- **Start** alle services opnieuw en bouw, als je Docker gebruikt, de nieuwste image opnieuw op of haal deze opnieuw op.
- **Als je niet meteen kunt updaten**, beperk dan tijdelijk de toegang (VPN/auth-proxy) totdat de patch is geïnstalleerd.

Controleer na het updaten of je instantie de nieuwste Rallly-versie meldt en bekijk de logs op waarschuwingen. Ga naar `<your‑rallly‑instance>/api/status` om de versie te controleren.

## Aanvullende informatie

Bekijk de volgende bronnen voor alle technische details over de vier kwetsbaarheden:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Kritieke kwetsbaarheid die uitvoering van code op afstand mogelijk maakt
- [Aanvullende kwetsbaarheden (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Denial-of-service en blootstelling van broncode
