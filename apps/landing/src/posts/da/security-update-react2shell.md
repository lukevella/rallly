---
title: 'Sikkerhedsopdatering: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Vigtige sikkerhedsopdateringer, der håndterer sårbarheder i React Server
  Components, herunder React2Shell. Hvis du selv hoster Rallly, skal du opdatere
  med det samme.
---

**Denne meddelelse er kun relevant for selvhostede Rallly-installationer.** Hvis du bruger Rallylys hostede tjeneste på [rallly.co](https://rallly.co), behøver du ikke foretage dig noget. Serverne blev opdateret inden for få timer efter offentliggørelsen af CVE'erne, og der var ikke noget sikkerhedsbrud i det tidsrum.

---

Der er blevet opdaget en kritisk sikkerhedssårbarhed i React Server Components, som påvirker Rallly. På installationer, der ikke er opdateret, kan sårbarheden give en angriber mulighed for at køre kode eksternt på din server. Hvis din instans er tilgængelig fra internettet, og du ikke kører den seneste udgave, **er din server i betydelig risiko**.

Denne sårbarhed, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (også kendt som [React2Shell](https://react2shell.com/)), påvirker mange applikationer, der er bygget med React 19. Der er allerede rapporteret om sikkerhedsbrud i den virkelige verden, hvor angribere har installeret skadelig software på kompromitterede servere.

Derudover er yderligere to sårbarheder ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) blevet identificeret i React Server Components-protokollen (RSC). Selvom disse ikke gør det muligt at køre kode eksternt, skal der stadig installeres rettelser.

React-teamet opdagede senere, at rettelsen til CVE-2025-55184 var ufuldstændig, hvilket krævede en yderligere rettelse. Dette er blevet offentliggjort som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Tidslinje

- **3. december 2025**: React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) blev annonceret af React-teamet
- **4. december 2025**: Jeg udgav v4.5.7 (opdateret Next.js-pakke)
- **8. december 2025**: Jeg udgav v4.5.8 (opdateret React-pakke, fuldt beskyttet mod React2Shell)
- **11. december 2025**: Yderligere to CVE'er ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) blev annonceret af React-teamet. Jeg udgav v4.5.10 som reaktion på dette
- **12. december 2025**: React-teamet annoncerede, at rettelsen til CVE-2025-55184 var ufuldstændig. Den yderligere rettelse blev offentliggjort som [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Jeg udgav v4.5.11 som reaktion på dette

## Påkrævede handlinger

Hvis du selv hoster Rallly, skal du straks gøre følgende:

- **Opdater** Rallly til den seneste version (v4.5.11 eller nyere) for at være beskyttet mod alle fire CVE'er. Se [udgivelsesnoterne](https://github.com/lukevella/rallly/releases/tag/v4.5.11) for flere oplysninger.
- Hvis du bruger v4.5.10, skal du opdatere til v4.5.11, da den tidligere rettelse var ufuldstændig.
- Hvis du bruger v4.5.8 (som var fuldt beskyttet mod React2Shell), skal du opdatere til v4.5.11 for at være beskyttet mod alle sårbarheder.
- Hvis du bruger v4.5.7, bør du opdatere til v4.5.11, da v4.5.7 muligvis ikke gav fuld beskyttelse mod React2Shell.
- Hvis du bruger en version før v4.5.7, er du sårbar over for React2Shell og bør opdatere med det samme.
- **Genstart** alle tjenester, og genopbyg eller hent det seneste image, hvis du bruger Docker.
- **Hvis du ikke kan opdatere med det samme**, skal du midlertidigt begrænse adgangen (VPN eller godkendelsesproxy), indtil systemet er opdateret.

Når du har opdateret, skal du kontrollere, at din instans viser den seneste Rallly-version, og gennemgå logfilerne for eventuelle advarsler. Du kan kontrollere versionen her: `<your‑rallly‑instance>/api/status`.

## Yderligere oplysninger

Du kan finde alle tekniske detaljer om de fire sårbarheder her:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – Kritisk sårbarhed, der gør det muligt at køre kode eksternt
- [Yderligere sårbarheder (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – Tjenestenægtelse og eksponering af kildekode
