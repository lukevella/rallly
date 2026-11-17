---
title: 'Bezpečnostní aktualizace: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Důležité bezpečnostní aktualizace řeší zranitelnosti React Server Components
  včetně React2Shell. Provozovatelé vlastních instalací by měli aktualizovat
  okamžitě.
---

**Toto oznámení se týká pouze vlastních instalací Rallly.** Pokud používáte hostovanou službu Rallly na adrese [rallly.co](https://rallly.co), nemusíte podnikat žádné kroky. Servery byly opraveny během několika hodin od oznámení CVE a během této doby nedošlo k žádnému narušení bezpečnosti.

---

V React Server Components byla objevena kritická bezpečnostní zranitelnost, která se týká Rallly. U neaktualizovaných instalací by tato zranitelnost mohla útočníkovi umožnit vzdálené spuštění kódu na vašem serveru. Pokud je vaše instance dostupná z internetu a nepoužíváte nejnovější vydání, **váš server je vystaven značnému riziku**.

Tato zranitelnost, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182), známá také jako [React2Shell](https://react2shell.com/), se týká mnoha aplikací vytvořených pomocí Reactu 19. Již byly nahlášeny skutečné případy narušení bezpečnosti, při kterých útočníci nasadili škodlivý software na napadené servery.

Kromě toho byly v protokolu React Server Components (RSC) identifikovány dvě další zranitelnosti ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Přestože neumožňují vzdálené spuštění kódu, je stále nutné je opravit aktualizací.

Tým React později zjistil, že oprava zranitelnosti CVE-2025-55184 nebyla úplná, a proto byla zapotřebí další oprava. Ta byla zveřejněna jako [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Časová osa

- **3. prosince 2025**: Tým React oznámil React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4. prosince 2025**: Vydal jsem v4.5.7 (aktualizovaný balíček Next.js)
- **8. prosince 2025**: Vydal jsem v4.5.8 (aktualizovaný balíček Reactu, plná ochrana proti React2Shell)
- **11. prosince 2025**: Tým React oznámil dvě další CVE ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). V reakci na to jsem vydal v4.5.10
- **12. prosince 2025**: Tým React oznámil, že oprava zranitelnosti CVE-2025-55184 nebyla úplná. Další oprava byla zveřejněna jako [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). V reakci na to jsem vydal v4.5.11

## Je nutné provést tyto kroky

Pokud Rallly provozujete na vlastním serveru, proveďte okamžitě následující kroky:

- **Aktualizujte** Rallly na nejnovější verzi (v4.5.11 nebo novější), abyste byli chráněni proti všem čtyřem CVE. Podrobnosti najdete v [poznámkách k vydání](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Pokud používáte v4.5.10, musíte aktualizovat na v4.5.11, protože předchozí oprava nebyla úplná.
- Pokud používáte v4.5.8 (která poskytovala úplnou ochranu proti React2Shell), musíte aktualizovat na v4.5.11, abyste byli chráněni proti všem zranitelnostem.
- Pokud používáte v4.5.7, měli byste aktualizovat na v4.5.11, protože v4.5.7 nemusela poskytovat úplnou ochranu proti React2Shell.
- Pokud používáte verzi starší než v4.5.7, jste zranitelní vůči React2Shell a měli byste okamžitě aktualizovat.
- **Restartujte** všechny služby a pokud používáte Docker, znovu sestavte image nebo stáhněte nejnovější image.
- **Pokud nemůžete aktualizovat ihned**, dočasně omezte přístup (pomocí VPN nebo ověřovacího proxy serveru), dokud nebude instalace opravena.

Po aktualizaci ověřte, že vaše instance hlásí nejnovější verzi Rallly, a zkontrolujte protokoly, zda neobsahují varování. Verzi ověříte na adrese: `<your‑rallly‑instance>/api/status`.

## Další informace

Úplné technické podrobnosti o všech čtyřech zranitelnostech najdete zde:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – kritická zranitelnost umožňující vzdálené spuštění kódu
- [Další zranitelnosti (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – odepření služby a zpřístupnění zdrojového kódu
