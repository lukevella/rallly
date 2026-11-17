---
title: Introduserer Rallly API
date: '2026-09-15'
category: Product
excerpt: >-
  Opprett avstemninger, les resultater og lukk dem fra dine egne verktøy. API-et
  er nå tilgjengelig for Pro-områder på Rallly Cloud.
---

Rallly har hatt et lite API bak en funksjonsbryter en stund. En håndfull personer har brukt det til å opprette avstemninger fra sine egne systemer, og tilbakemeldingene deres har formet det som lanseres i dag. Nå er det åpent for alle Pro-områder på Rallly Cloud.

![Et kodeverktøy som viser en fetch-forespørsel som oppretter en datoavstemning med tre alternativer gjennom Rallly API](/static/images/rallly-api/create-poll-editor.svg)

## Dette gjør API-et

API-et dekker hele livsløpet til en avstemning:

- **Opprett en avstemning** med enten hele dager eller tidsintervaller. Tidsintervaller kan angis ett og ett eller genereres fra en tidsplan, for eksempel hvert 30. minutt mellom kl. 9 og 17 på hverdager de neste to ukene.
- **Vis og les avstemninger**, filtrert etter status, med de samme alternativene og innstillingene som du ser i appen.
- **Les resultater**: antall stemmer per alternativ og hvilke alternativer som leder.
- **Les deltakere** og hvordan hver av dem stemte.
- **Lukk eller slett** en avstemning når en beslutning er tatt.

Hver forespørsel er knyttet til ett område. API-nøkkelen identifiserer området, så alt du oppretter eller leser, tilhører det.

## Kom i gang

Eieren av området oppretter en nøkkel under **Innstillinger → API-nøkler**. Forespørsler sender den med som et bearer-token:

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

Svaret inneholder en `inviteUrl` som du kan dele med deltakerne, og en `adminUrl` for arrangøren. Hvert område kan gjøre 60 forespørsler i minuttet.

[API-referansen](https://support.rallly.co/api-reference/introduction) inneholder alle endepunktene med eksempler på forespørsler og svar, og OpenAPI-dokumentet er tilgjengelig hvis du heller vil generere en klient.

## Hva skjer videre?

Det fungerer å spørre etter resultater med jevne mellomrom, men det er ikke slik de fleste integrasjoner ønsker å fungere. Det er planlagt webhooks for avstemninger, slik at systemet ditt får beskjed når et nytt svar kommer inn eller en avstemning lukkes. Det finnes ingen dato for dette ennå. Hvis du bygger noe med API-et, vil jeg gjerne høre hva du lager, og hva som står i veien, på [feedback@rallly.co](mailto:feedback@rallly.co).
