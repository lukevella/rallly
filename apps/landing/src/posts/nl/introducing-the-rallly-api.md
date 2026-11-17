---
title: De Rallly API is er
date: '2026-09-15'
category: Product
excerpt: >-
  Maak Polls, lees resultaten en sluit ze vanuit je eigen tools. De API is nu
  beschikbaar voor Pro-ruimtes op Rallly Cloud.
---

Rallly heeft al een tijdje een kleine API achter een functievlag. Een handvol mensen gebruikte deze om Polls vanuit hun eigen systemen te maken, en hun feedback heeft bepaald wat er vandaag wordt uitgebracht. De API is nu beschikbaar voor elke Pro-ruimte op Rallly Cloud.

![Een code-editor met een fetch-aanvraag die via de Rallly API een datum-Poll met drie opties maakt](/static/images/rallly-api/create-poll-editor.svg)

## Wat je ermee kunt doen

De API dekt de volledige levenscyclus van een Poll:

- **Een Poll maken** met hele dagen of tijdvakken. Tijdvakken kunnen een voor een worden opgegeven of aan de hand van een schema worden gegenereerd, bijvoorbeeld elke 30 minuten tussen 9 en 17 uur op werkdagen gedurende de komende twee weken.
- **Polls weergeven en lezen**, gefilterd op status, met dezelfde opties en instellingen die je in de app ziet.
- **Resultaten lezen**: het aantal stemmen per optie en welke opties vooropstaan.
- **Deelnemers lezen** en zien hoe iedereen heeft gestemd.
- **Een Poll sluiten of verwijderen** zodra er een beslissing is genomen.

Elke aanvraag is gekoppeld aan één Ruimte. De API-sleutel identificeert de Ruimte, dus alles wat je maakt of leest, hoort daarbij.

## Aan de slag

De eigenaar van de Ruimte maakt een sleutel aan via **Instellingen → API-sleutels**. Aanvragen sturen deze mee als bearer-token:

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

Het antwoord bevat een `inviteUrl` om met deelnemers te delen en een `adminUrl` voor de organisator. Elke Ruimte kan 60 aanvragen per minuut doen.

De [API-referentie](https://support.rallly.co/api-reference/introduction) bevat elk endpoint met voorbeelden van aanvragen en antwoorden. Het OpenAPI-document is ook beschikbaar als je liever zelf een client genereert.

## Wat komt hierna

Resultaten opvragen werkt, maar de meeste integraties willen niet op die manier werken. Er staan webhooks voor Poll-gebeurtenissen op de planning, zodat je systeem meteen hoort wanneer er een nieuw antwoord binnenkomt of een Poll wordt gesloten. Daar is nog geen datum voor. Als je iets bouwt met de API, hoor ik graag wat je maakt en waar je tegenaan loopt via [feedback@rallly.co](mailto:feedback@rallly.co).
