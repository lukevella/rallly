---
title: 'Tietoturvapäivitys: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Tärkeitä tietoturvapäivityksiä React Server Components -haavoittuvuuksiin,
  mukaan lukien React2Shell. Omalla palvelimella ylläpidettävien asennusten
  käyttäjien tulee päivittää välittömästi.
---

**Tämä ilmoitus koskee vain omalla palvelimella ylläpidettäviä Rallly-asennuksia.** Jos käytät Ralllyn ylläpidettyä palvelua osoitteessa [rallly.co](https://rallly.co), sinun ei tarvitse tehdä mitään. Palvelimet paikattiin muutaman tunnin kuluessa CVE-tunnusten julkistamisesta, eikä tuona aikana tapahtunut tietomurtoa.

---

React Server Componentsista on löydetty kriittinen tietoturvahaavoittuvuus, joka vaikuttaa Ralllyyn. Paikkaamattomissa asennuksissa haavoittuvuus voi antaa hyökkääjälle mahdollisuuden suorittaa koodia etänä palvelimellasi. Jos instanssisi on käytettävissä internetistä etkä käytä uusinta julkaisua, **palvelimesi on merkittävässä vaarassa**.

Tämä haavoittuvuus, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (tunnetaan myös nimellä [React2Shell](https://react2shell.com/)), vaikuttaa moniin React 19:llä rakennettuihin sovelluksiin. Tosielämän tietomurroista on jo raportoitu, ja hyökkääjät ovat asentaneet haittaohjelmistoja vaarantuneille palvelimille.

Lisäksi React Server Components (RSC) -protokollasta on tunnistettu kaksi muuta haavoittuvuutta ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183) ja [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Vaikka nämä eivät mahdollista koodin suorittamista etänä, ne on silti paikattava.

React-tiimi havaitsi myöhemmin, että CVE-2025-55184:n korjaus oli puutteellinen, joten tarvittiin uusi korjaus. Tämä on ilmoitettu tunnuksella [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Aikajana

- **3. joulukuuta 2025**: React-tiimi ilmoitti React2Shell-haavoittuvuudesta ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4. joulukuuta 2025**: Julkaisin version v4.5.7 (päivitetty Next.js-paketti)
- **8. joulukuuta 2025**: Julkaisin version v4.5.8 (päivitetty React-paketti, joka suojaa täysin React2Shelliltä)
- **11. joulukuuta 2025**: React-tiimi ilmoitti kahdesta muusta CVE-haavoittuvuudesta ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183) ja [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Julkaisin niiden vuoksi version v4.5.10
- **12. joulukuuta 2025**: React-tiimi ilmoitti, että CVE-2025-55184:n korjaus oli puutteellinen. Lisäkorjaus ilmoitettiin tunnuksella [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Julkaisin sen vuoksi version v4.5.11

## Toimenpiteet

Jos ylläpidät Ralllya omalla palvelimellasi, tee seuraavat toimet välittömästi:

- **Päivitä** Rallly uusimpaan versioon (v4.5.11 tai uudempi), jotta kaikki neljä CVE-haavoittuvuutta on korjattu. Katso lisätiedot [julkaisutiedoista](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Jos käytössäsi on v4.5.10, sinun on päivitettävä versioon v4.5.11, koska aiempi korjaus oli puutteellinen.
- Jos käytössäsi on v4.5.8 (joka suojasi täysin React2Shelliltä), sinun on päivitettävä versioon v4.5.11, jotta kaikki haavoittuvuudet on korjattu.
- Jos käytössäsi on v4.5.7, sinun kannattaa päivittää versioon v4.5.11, sillä v4.5.7 ei välttämättä suojannut täysin React2Shelliltä.
- Jos käytössäsi on versiota v4.5.7 vanhempi versio, olet altis React2Shellille ja sinun tulee päivittää välittömästi.
- **Käynnistä uudelleen** kaikki palvelut ja, jos käytät Dockeria, rakenna uudelleen tai lataa uusin näköistiedosto.
- **Jos et voi päivittää heti**, rajoita käyttöoikeus tilapäisesti (VPN tai todennusvälityspalvelin), kunnes päivitys on asennettu.

Varmista päivityksen jälkeen, että instanssisi ilmoittaa uusimman Rallly-version, ja tarkista lokeista mahdolliset varoitukset. Voit tarkistaa version osoitteessa: `<your‑rallly‑instance>/api/status`.

## Lisätietoja

Saat täydelliset tekniset tiedot kaikista neljästä haavoittuvuudesta:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) – kriittinen etäkoodin suorittamisen mahdollistava haavoittuvuus
- [Muut haavoittuvuudet (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) – palvelunestohyökkäyksen ja lähdekoodin paljastumisen mahdollistavat haavoittuvuudet
