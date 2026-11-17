---
title: Vi presenterar Rallly API
date: '2026-09-15'
category: Product
excerpt: >-
  Skapa förfrågningar, läs resultat och avsluta dem från dina egna verktyg.
  API:et är nu tillgängligt för Pro-områden på Rallly Cloud.
---

Rallly har haft ett litet API bakom en dold inställning ett tag. Några personer har använt det för att skapa förfrågningar från sina egna system, och deras feedback har format det som lanseras i dag. Nu är det öppet för alla Pro-områden på Rallly Cloud.

![En kodredigerare som visar en fetch-förfrågan som skapar en datumförfrågan med tre alternativ via Rallly API](/static/images/rallly-api/create-poll-editor.svg)

## Vad det gör

API:et täcker en förfrågans hela livscykel:

- **Skapa en förfrågan** med antingen hela dagar eller tidsintervall. Tidsintervall kan listas ett i taget eller genereras från ett schema, till exempel var 30:e minut mellan 9 och 17 på vardagar under de kommande två veckorna.
- **Visa och läsa förfrågningar**, filtrerade efter status, med samma alternativ och inställningar som du ser i appen.
- **Läsa resultat**: antal röster per alternativ och vilka alternativ som leder.
- **Läsa deltagare** och hur var och en röstade.
- **Avsluta eller ta bort** en förfrågan när ett beslut har fattats.

Varje begäran är kopplad till ett område. API-nyckeln identifierar området, så allt du skapar eller läser hör till det.

## Kom igång

Områdets ägare skapar en nyckel under **Inställningar → API-nycklar**. Begäranden skickar med den som en bearer-token:

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

Svaret innehåller en `inviteUrl` som du kan dela med deltagarna och en `adminUrl` för organisatören. Varje område kan göra 60 begäranden per minut.

I [API-dokumentationen](https://support.rallly.co/api-reference/introduction) finns alla slutpunkter med exempel på begäranden och svar. OpenAPI-dokumentet finns också tillgängligt om du hellre vill generera en klient.

## Vad händer härnäst

Det fungerar att fråga efter resultat, men det är inte så de flesta integrationer vill arbeta. Webhooks för händelser i förfrågningar är planerade, så att ditt system får veta när ett nytt svar kommer in eller en förfrågan avslutas. Det finns inget datum för det ännu. Om du bygger något med API:et vill jag gärna höra vad du bygger och vad som står i vägen på [feedback@rallly.co](mailto:feedback@rallly.co).
