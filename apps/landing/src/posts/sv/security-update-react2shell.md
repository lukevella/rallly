---
title: 'Säkerhetsuppdatering: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Viktiga säkerhetsuppdateringar som åtgärdar sårbarheter i React Server
  Components, inklusive React2Shell. De som kör egen drift bör uppdatera
  omedelbart.
---

**Det här meddelandet gäller endast Rallly-installationer med egen drift.** Om du använder Rallyys hostade tjänst på [rallly.co](https://rallly.co) behöver du inte göra någonting. Servrarna säkerhetsuppdaterades inom några timmar efter att CVE:erna offentliggjordes, och inget intrång skedde under den tiden.

---

En kritisk säkerhetssårbarhet har upptäckts i React Server Components som påverkar Rallly. På installationer som inte har uppdaterats kan sårbarheten göra det möjligt för en angripare att köra kod på distans på din server. Om din instans är åtkomlig från internet och du inte kör den senaste versionen är **din server utsatt för en betydande risk**.

Den här sårbarheten, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (även kallad [React2Shell](https://react2shell.com/)), påverkar många program som bygger på React 19. Det har redan rapporterats om verkliga intrång där angripare installerat skadlig programvara på utsatta servrar.

Dessutom har två ytterligare sårbarheter ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) identifierats i protokollet för React Server Components (RSC). Även om dessa inte möjliggör fjärrkörning av kod måste de ändå åtgärdas genom uppdatering.

React-teamet upptäckte senare att åtgärden för CVE-2025-55184 var ofullständig, vilket krävde ytterligare en patch. Detta har offentliggjorts som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Tidslinje

- **3 december 2025**: React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) offentliggjordes av React-teamet
- **4 december 2025**: Jag publicerade v4.5.7 (uppdaterat Next.js-paket)
- **8 december 2025**: Jag publicerade v4.5.8 (uppdaterat React-paket, fullt skydd mot React2Shell)
- **11 december 2025**: Två ytterligare CVE:er ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) offentliggjordes av React-teamet. Som svar publicerade jag v4.5.10
- **12 december 2025**: React-teamet meddelade att åtgärden för CVE-2025-55184 var ofullständig. Den ytterligare åtgärden offentliggjordes som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Som svar publicerade jag v4.5.11

## Åtgärd krävs

Om du kör Rallly med egen drift ska du omedelbart vidta följande åtgärder:

- **Uppdatera** Rallly till den senaste versionen (v4.5.11 eller senare) för att skyddas mot alla fyra CVE:er. Mer information finns i [versionsinformationen](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Om du använder v4.5.10 måste du uppdatera till v4.5.11 eftersom den tidigare åtgärden var ofullständig.
- Om du använder v4.5.8 (som gav fullt skydd mot React2Shell) måste du uppdatera till v4.5.11 för att skyddas mot alla sårbarheter.
- Om du använder v4.5.7 bör du uppdatera till v4.5.11 eftersom v4.5.7 kanske inte gav fullt skydd mot React2Shell.
- Om du använder en version före v4.5.7 är du sårbar för React2Shell och bör uppdatera omedelbart.
- **Starta om** alla tjänster och bygg om eller hämta den senaste avbildningen om du använder Docker.
- **Om du inte kan uppdatera direkt**, begränsa tillfälligt åtkomsten (VPN/autentiseringsproxy) tills uppdateringen är installerad.

När du har uppdaterat ska du kontrollera att din instans rapporterar den senaste Rallly-versionen och granska loggarna efter eventuella varningar. Kontrollera versionen genom att besöka: `<your‑rallly‑instance>/api/status`.

## Ytterligare information

Fullständig teknisk information om alla fyra sårbarheter finns här:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – kritisk sårbarhet som möjliggör fjärrkörning av kod
- [Ytterligare sårbarheter (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – överbelastningsattack och exponering av källkod
