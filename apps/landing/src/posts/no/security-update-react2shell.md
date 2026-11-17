---
title: 'Sikkerhetsoppdatering: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Viktige sikkerhetsoppdateringer som løser sårbarheter i React Server
  Components, inkludert React2Shell. De som drifter Rallly selv, bør oppdatere
  umiddelbart.
---

**Denne kunngjøringen gjelder bare selvhostede Rallly-installasjoner.** Hvis du bruker Ralllys driftede tjeneste på [rallly.co](https://rallly.co), trenger du ikke å gjøre noe. Serverne ble oppdatert innen noen timer etter at CVE-ene ble kunngjort, og det var ingen sikkerhetsbrudd i dette tidsrommet.

---

Det er oppdaget en kritisk sikkerhetssårbarhet i React Server Components som påvirker Rallly. På installasjoner som ikke er oppdatert, kan denne sårbarheten gjøre det mulig for en angriper å kjøre kode eksternt på serveren din. Hvis instansen din er tilgjengelig fra internett, og du ikke kjører den nyeste versjonen, **er serveren din utsatt for betydelig risiko**.

Denne sårbarheten, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (også kjent som [React2Shell](https://react2shell.com/)), påvirker mange applikasjoner som er bygget med React 19. Det er allerede rapportert om reelle sikkerhetsbrudd der angripere har installert skadelig programvare på kompromitterte servere.

I tillegg er det identifisert to andre sårbarheter ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) i React Server Components-protokollen (RSC). Selv om disse ikke gjør det mulig å kjøre kode eksternt, må de likevel utbedres med en oppdatering.

React-teamet oppdaget senere at utbedringen for CVE-2025-55184 var ufullstendig, og at det var nødvendig med en ekstra oppdatering. Dette er offentliggjort som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Tidslinje

- **3. desember 2025**: React-teamet kunngjorde React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4. desember 2025**: Jeg publiserte v4.5.7 (oppdatert Next.js-pakke)
- **8. desember 2025**: Jeg publiserte v4.5.8 (oppdatert React-pakke, fullt beskyttet mot React2Shell)
- **11. desember 2025**: React-teamet kunngjorde to andre CVE-er ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Jeg publiserte v4.5.10 som svar på dette
- **12. desember 2025**: React-teamet kunngjorde at utbedringen for CVE-2025-55184 var ufullstendig. Den ekstra utbedringen ble offentliggjort som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Jeg publiserte v4.5.11 som svar på dette

## Krever handling

Hvis du drifter Rallly selv, må du gjøre følgende umiddelbart:

- **Oppdater** Rallly til den nyeste versjonen (v4.5.11 eller nyere) for å være beskyttet mot alle fire CVE-ene. Se [versjonsmerknadene](https://github.com/lukevella/rallly/releases/tag/v4.5.11) for mer informasjon.
- Hvis du bruker v4.5.10, må du oppdatere til v4.5.11, siden den forrige utbedringen var ufullstendig.
- Hvis du bruker v4.5.8 (som ga full beskyttelse mot React2Shell), må du oppdatere til v4.5.11 for å være beskyttet mot alle sårbarhetene.
- Hvis du bruker v4.5.7, bør du oppdatere til v4.5.11, siden v4.5.7 kanskje ikke ga full beskyttelse mot React2Shell.
- Hvis du bruker en versjon eldre enn v4.5.7, er du sårbar for React2Shell og bør oppdatere umiddelbart.
- **Start** alle tjenester på nytt, og hvis du bruker Docker, må du bygge bildet på nytt eller hente det nyeste bildet.
- **Hvis du ikke kan oppdatere med en gang**, bør du midlertidig begrense tilgangen (VPN/autentiseringsproxy) til systemet er oppdatert.

Når du har oppdatert, må du kontrollere at instansen din viser den nyeste Rallly-versjonen, og se gjennom loggene etter eventuelle advarsler. Slik sjekker du versjonen: `<your‑rallly‑instance>/api/status`.

## Mer informasjon

Du finner fullstendige tekniske detaljer om alle de fire sårbarhetene her:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – Kritisk sårbarhet for ekstern kjøring av kode
- [Andre sårbarheter (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – Tjenestenekt og eksponering av kildekode
