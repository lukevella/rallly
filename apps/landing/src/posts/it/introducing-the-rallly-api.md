---
title: Presentiamo l’API di Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Crea sondaggi, leggi i risultati e chiudili dai tuoi strumenti. L’API è ora
  disponibile per gli Spazi Pro su Rallly Cloud.
---

Rallly dispone da tempo di una piccola API nascosta dietro un flag. Alcune persone l’hanno utilizzata per creare sondaggi dai propri sistemi e il loro feedback ha contribuito a definire ciò che rendiamo disponibile oggi. Ora è aperta a tutti gli Spazi Pro su Rallly Cloud.

![Un editor di codice che mostra una richiesta fetch per creare un sondaggio sulle date con tre opzioni tramite l’API di Rallly](/static/images/rallly-api/create-poll-editor.svg)

## Cosa fa

L’API copre l’intero ciclo di vita di un sondaggio:

- **Crea un sondaggio** con giornate intere o fasce orarie. Le fasce orarie possono essere elencate una per una oppure generate in base a un programma, ad esempio ogni 30 minuti tra le 9 e le 17 nei giorni feriali delle due settimane successive.
- **Elenca e legge i sondaggi**, filtrati per stato, con le stesse opzioni e impostazioni che vedi nell’app.
- **Legge i risultati**: il numero di voti per ogni opzione e quali opzioni sono in testa.
- **Legge i partecipanti** e il voto espresso da ciascuno.
- **Chiude o elimina** un sondaggio una volta presa una decisione.

Ogni richiesta è associata a un solo Spazio. La chiave API identifica lo Spazio, quindi tutto ciò che crei o leggi appartiene a quello Spazio.

## Per iniziare

Il proprietario dello Spazio crea una chiave in **Impostazioni → Chiavi API**. Le richieste la inviano come token bearer:

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

La risposta include un `inviteUrl` da condividere con i partecipanti e un `adminUrl` per l’Organizzatore. Ogni Spazio può effettuare 60 richieste al minuto.

Il [riferimento dell’API](https://support.rallly.co/api-reference/introduction) contiene tutti gli endpoint con esempi di richieste e risposte. È disponibile anche il documento OpenAPI, se preferisci generare un client.

## Cosa verrà dopo

Consultare periodicamente i risultati funziona, ma non è il modo in cui la maggior parte delle integrazioni vuole operare. Sono previsti webhook per gli eventi dei sondaggi, così il tuo sistema potrà ricevere una notifica quando arriva una nuova Risposta o quando un sondaggio viene chiuso. Non c’è ancora una data. Se crei qualcosa con l’API, mi piacerebbe sapere a cosa stai lavorando e cosa ti ostacola: scrivimi all’indirizzo [feedback@rallly.co](mailto:feedback@rallly.co).
