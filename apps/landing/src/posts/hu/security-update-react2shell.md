---
title: 'Biztonsági frissítés: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Fontos biztonsági frissítések a React Server Components sérülékenységeinek,
  köztük a React2Shellnek a javítására. A saját üzemeltetésű rendszerek
  üzemeltetőinek azonnal frissíteniük kell.
---

**Ez a közlemény csak a Rallly saját üzemeltetésű telepítéseire vonatkozik.** Ha a Rallly hosztolt szolgáltatását használod a [rallly.co](https://rallly.co) címen, nincs teendőd. A szervereket a CVE-k bejelentését követő néhány órán belül javítottuk, és ez idő alatt nem történt adatszivárgás vagy feltörés.

---

Kritikus biztonsági sérülékenységet fedeztek fel a React Server Componentsben, amely a Ralllyt is érinti. A nem javított telepítéseken ez a sérülékenység lehetővé teheti, hogy egy támadó távolról kódot futtasson a szervereden. Ha a példányod elérhető az internetről, és nem a legújabb kiadást használod, **a szervered jelentős veszélynek van kitéve**.

Ez a sérülékenység, a [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (más néven [React2Shell](https://react2shell.com/)), számos React 19-cel készült alkalmazást érint. Már valódi feltörésekről is érkeztek jelentések, amelyek során a támadók kártékony szoftvereket telepítettek a feltört szerverekre.

Emellett két további sérülékenységet ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) is azonosítottak a React Server Components (RSC) protokollban. Ezek ugyan nem teszik lehetővé távoli kód végrehajtását, de ezeket is mindenképpen javítani kell.

A React csapata később felfedezte, hogy a CVE-2025-55184 javítása nem volt teljes, ezért további javításra volt szükség. Ezt [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) néven hozták nyilvánosságra.

## Idővonal

- **2025. december 3.**: A React csapata bejelentette a React2Shellt ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **2025. december 4.**: Közzétettem a v4.5.7-es verziót (frissített Next.js-csomaggal)
- **2025. december 8.**: Közzétettem a v4.5.8-as verziót (frissített React-csomaggal, amely teljes védelmet nyújt a React2Shell ellen)
- **2025. december 11.**: A React csapata bejelentett két további CVE-t ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Válaszul közzétettem a v4.5.10-es verziót
- **2025. december 12.**: A React csapata bejelentette, hogy a CVE-2025-55184 javítása nem volt teljes. A további javítást [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) néven hozták nyilvánosságra. Válaszul közzétettem a v4.5.11-es verziót

## Szükséges teendők

Ha a Ralllyt saját magad üzemelteted, azonnal végezd el a következő lépéseket:

- **Frissítsd** a Ralllyt a legújabb verzióra (v4.5.11 vagy újabb), hogy mind a négy CVE-vel szemben védett legyél. A részletekért tekintsd meg a [kiadási megjegyzéseket](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Ha a v4.5.10-es verziót használod, frissítened kell a v4.5.11-es verzióra, mert az előző javítás nem volt teljes.
- Ha a v4.5.8-as verziót használod (amely teljes védelmet nyújtott a React2Shell ellen), frissítened kell a v4.5.11-es verzióra, hogy minden sérülékenységgel szemben védett legyél.
- Ha a v4.5.7-es verziót használod, érdemes frissítened a v4.5.11-es verzióra, mivel a v4.5.7 lehet, hogy nem nyújtott teljes védelmet a React2Shell ellen.
- Ha a v4.5.7-nél korábbi verziót használsz, sebezhető vagy a React2Shellel szemben, ezért azonnal frissítened kell.
- **Indítsd újra** az összes szolgáltatást, Docker használata esetén pedig építsd újra a legújabb lemezképet, vagy töltsd le azt.
- **Ha nem tudsz azonnal frissíteni**, a javítás telepítéséig ideiglenesen korlátozd a hozzáférést (VPN-nel vagy hitelesítési proxyval).

A frissítés után ellenőrizd, hogy a példányod a legújabb Rallly-verziót jelenti-e, és nézd át a naplókat az esetleges figyelmeztetések miatt. A verzió ellenőrzéséhez keresd fel ezt a címet: `<your‑rallly‑instance>/api/status`.

## További információk

A mind a négy sérülékenységgel kapcsolatos teljes technikai részletekért:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – Kritikus, távoli kódfuttatást lehetővé tevő sérülékenység
- [További sérülékenységek (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – Szolgáltatásmegtagadás és forráskód-kitettség
