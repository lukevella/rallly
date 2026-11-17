---
title: Introduktion til Rallly API'et
date: '2026-09-15'
category: Product
excerpt: >-
  Opret afstemninger, læs resultater, og luk dem fra dine egne værktøjer. API'et
  er nu tilgængeligt for Pro-rum på Rallly Cloud.
---

Rallly har haft et lille API bag en funktionskontakt i et stykke tid. En håndfuld personer har brugt det til at oprette afstemninger fra deres egne systemer, og deres feedback har været med til at forme det, der lanceres i dag. Det er nu åbent for alle Pro-rum på Rallly Cloud.

![En kodeeditor, der viser en fetch-anmodning, som opretter en datoafstemning med tre muligheder via Rallly API'et](/static/images/rallly-api/create-poll-editor.svg)

## Hvad det kan

API'et dækker hele en afstemnings livscyklus:

- **Opret en afstemning** med enten hele dage eller tidsrum. Tidsrum kan angives ét ad gangen eller genereres ud fra en tidsplan, for eksempel hvert 30. minut mellem kl. 9 og 17 på hverdage i de næste to uger.
- **Vis og læs afstemninger**, filtreret efter status, med de samme muligheder og indstillinger, som du ser i appen.
- **Læs resultater**: antal stemmer pr. mulighed, og hvilke muligheder der fører.
- **Læs deltagere** og se, hvordan hver enkelt har stemt.
- **Luk eller slet** en afstemning, når der er truffet en beslutning.

Alle anmodninger er knyttet til ét rum. API-nøglen identificerer rummet, så alt, hvad du opretter eller læser, hører til der.

## Sådan kommer du i gang

Ejeren af rummet opretter en nøgle under **Indstillinger → API-nøgler**. Anmodninger sender den med som et bearer-token:

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

Svaret indeholder en `inviteUrl`, som du kan dele med deltagerne, og en `adminUrl` til arrangøren. Hvert rum kan foretage 60 anmodninger i minuttet.

[API-referencen](https://support.rallly.co/api-reference/introduction) indeholder alle endpoints med eksempler på anmodninger og svar, og OpenAPI-dokumentet er tilgængeligt, hvis du hellere vil generere en klient.

## Hvad kommer der nu

Det fungerer at hente resultater løbende, men det er ikke sådan, de fleste integrationer ønsker at køre. Der er planlagt webhooks for afstemningshændelser, så dit system får besked, når der kommer et nyt svar, eller når en afstemning bliver lukket. Der er endnu ingen dato for det. Hvis du bygger noget med API'et, vil jeg gerne høre, hvad du bygger, og hvad der står i vejen, på [feedback@rallly.co](mailto:feedback@rallly.co).
