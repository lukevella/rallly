---
title: Esittelyssä Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Uusi CLI itse ylläpidettyjen Rallly-instanssien asentamiseen, määrittämiseen
  ja hallintaan – HTTPS ja kuvien lataukset toimivat heti ilman lisämäärityksiä.
---

Ralllyn itse ylläpitäminen edellytti aiemmin esimerkin `docker-compose.yml` kopioimista, sen muokkaamista käsin, oman käänteisvälityspalvelimen valitsemista ja S3-säilön määrittämistä, jos kuvien latausten haluttiin toimivan. Se oli mahdollista, mutta jokainen asennus oli hieman erilainen, ja tukiviesteissä toistui kysymys: ”määritinkö tuon kohdan oikein?”

Siksi rakensimme kunnollisen CLI:n, joka hoitaa puolestasi asennuksen, määrittämisen ja päivittäisen hallinnan.

## Asenna yhdellä komennolla

```sh
curl -fsSL https://get.rallly.co | bash
```

Asennusohjelma tarkistaa ympäristösi, opastaa määritysten tekemisessä (verkkotunnus, tukisähköposti, SMTP), luo salaisuudet puolestasi ja käynnistää kaiken. Mitään ei tarvitse muokata käsin.

Toimiva instanssi sisältää nyt:

- itse **Ralllyn**
- **PostgreSQL**-tietokannan
- **Traefikin** käänteisvälityspalvelimena sekä automaattiset Let's Encrypt -varmenteet
- **Garagen** S3-yhteensopivana objektitallennuksena, joten avatarien ja kuvien lataukset toimivat heti

Sinun ei enää tarvitse hankkia omaa välityspalvelinta tai objektitallennusta saadaksesi täydellisen instanssin käyttöön. Jos kuitenkin haluat käyttää ulkoisia palveluita (hallinnoitua Postgresia, AWS S3:a, omaa Nginxiä tai Caddyä), sekin onnistuu: määritä tarvittavat muuttujat `.env`-tiedostossa, jolloin näiden palveluiden mukana toimitettavat säilöt eivät yksinkertaisesti käynnisty.

## Hallitse CLI:llä

Asennuksen jälkeen kaikki tapahtuu `rallly.sh`-CLI:n kautta:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Erityisesti päivitykset hoituvat nyt yhdellä komennolla. `./rallly.sh update` noutaa uusimmat näköistiedostot, luo säilöt uudelleen ja säilyttää tietosi ja määrityksesi. CLI seuraa oletusarvoisesti `lukevella/rallly:4`-tagia, joten saat automaattisesti yhteensopivat 4.x-julkaisut.

Kun meillä on enemmän hallintaa kokonaisuudesta, voimme tulevaisuudessa lisätä esimerkiksi uusia palveluita ilman, että asennusprosessi monimutkaistuu tai käyttäjien täytyy muokata compose-tiedostojaan.

## Käytätkö Ralllya jo itse ylläpidettynä?

Jos ajat Ralllya jo käsin muokatusta `docker-compose.yml`- tai `config.env`-tiedostosta, vaiheittainen [siirtymisopas](https://support.rallly.co/self-hosting/migration) opastaa päivittämään version 4.10:een ja siirtymään CLI:n käyttöön tietoja menettämättä. Tärkeintä on siirtää mukana `SECRET_PASSWORD`, joka salaa istunnot.

## Näin pääset alkuun

- **Uusi asennus**: [Asennusopas](https://support.rallly.co/self-hosting/installation/docker)
- **Päivittäinen hallinta**: [Hallintaopas](https://support.rallly.co/self-hosting/management)
- **Siirtyminen vanhemmasta asennuksesta**: [Siirtymisopas](https://support.rallly.co/self-hosting/migration)

Tämän julkaisun tavoitteena oli tehdä Ralllyn itse ylläpitämisestä tuotteen kaltaista reseptin sijaan. Jos kohtaat matkan varrella ongelmia tai sinulla on ideoita siitä, mitä pitäisi tehdä seuraavaksi, kuulisin niistä mielelläni osoitteessa [feedback@rallly.co](mailto:feedback@rallly.co).
