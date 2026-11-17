---
title: 'Rallly API:n esittely'
date: '2026-09-15'
category: Product
excerpt: >-
  Luo kyselyitä, lue tuloksia ja sulje kyselyitä omista työkaluistasi. API on
  nyt saatavilla Rallly Cloudin Pro-tiloissa.
---

Rallylla on ollut jo jonkin aikaa käytössä pieni, ominaisuuslipun takana oleva API. Muutamat ihmiset ovat käyttäneet sitä kyselyiden luomiseen omista järjestelmistään, ja heidän palautteensa on vaikuttanut siihen, mitä julkaisemme tänään. Nyt se on kaikkien Rallly Cloudin Pro-tilojen käytettävissä.

![Koodieditori, jossa näkyy fetch-pyyntö kolmen vaihtoehdon päivämääräkyselyn luomiseksi Rallly API:n kautta](/static/images/rallly-api/create-poll-editor.svg)

## Mitä se tekee

API kattaa kyselyn koko elinkaaren:

- **Luo kyselyn** joko kokonaisista päivistä tai aikaväleistä. Aikavälit voi luetella yksitellen tai luoda aikataulun perusteella, esimerkiksi 30 minuutin välein kello 9:n ja 17:n välillä arkipäivisin seuraavien kahden viikon ajan.
- **Listaa kyselyt ja lukee niiden tiedot** tilan perusteella suodatettuina. Käytettävissä ovat samat vaihtoehdot ja asetukset kuin sovelluksessa.
- **Lukee tulokset**: vaihtoehtokohtaiset äänimäärät ja sen, mitkä vaihtoehdot ovat johdossa.
- **Lukee osallistujat** ja sen, miten kukin heistä äänesti.
- **Sulkee tai poistaa** kyselyn, kun päätös on tehty.

Jokainen pyyntö kohdistuu yhteen Tilaan. API-avain tunnistaa Tilan, joten kaikki luomasi tai lukemasi kuuluu siihen.

## Näin pääset alkuun

Tilan omistaja luo avaimen kohdassa **Asetukset → API-avaimet**. Pyynnöissä se välitetään bearer-tunnuksena:

```sh
curl https://api.rallly.co/v1/polls \
  -H "Authorization: Bearer $RALLLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team offsite",
    "kind": "date",
    "options": [
      { "date": "2026-10-05" },
      { "date": "2026-10-06" },
      { "date": "2026-10-07" }
    ]
  }'
```

Vastaus sisältää `inviteUrl`-osoitteen, jonka voit jakaa osallistujille, sekä järjestäjälle tarkoitetun `adminUrl`-osoitteen. Kukin Tila voi tehdä 60 pyyntöä minuutissa.

[API-viite](https://support.rallly.co/api-reference/introduction) sisältää kaikki päätepisteet sekä pyynnöistä ja vastauksista kertovat esimerkit. OpenAPI-dokumentti on saatavilla, jos haluat mieluummin luoda asiakasohjelman.

## Mitä seuraavaksi

Tulosten jatkuva kysely toimii, mutta useimmat integraatiot eivät halua toimia niin. Kyselyiden tapahtumille on suunnitteilla webhookit, joiden avulla järjestelmäsi saa tiedon uudesta vastauksesta tai suljetusta kyselystä heti, kun se tapahtuu. Niille ei ole vielä päivämäärää. Jos rakennat jotain API:n päälle, haluaisin kuulla, mitä olet rakentamassa ja mikä tuottaa haasteita. Voit kirjoittaa osoitteeseen [feedback@rallly.co](mailto:feedback@rallly.co).
