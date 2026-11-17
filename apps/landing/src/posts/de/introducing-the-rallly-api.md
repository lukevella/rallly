---
title: Die Rallly API ist da
date: '2026-09-15'
category: Product
excerpt: >-
  Erstelle Umfragen, lies Ergebnisse aus und schließe sie über deine eigenen
  Tools ab. Die API ist jetzt für Pro-Gruppen in Rallly Cloud verfügbar.
---

Rallly bietet schon seit einiger Zeit eine kleine API hinter einem Feature-Flag. Einige wenige Personen haben sie genutzt, um Umfragen aus ihren eigenen Systemen heraus zu erstellen. Ihr Feedback hat maßgeblich geprägt, was heute veröffentlicht wird. Jetzt ist sie für jede Pro-Gruppe in Rallly Cloud verfügbar.

![Ein Code-Editor mit einer Fetch-Anfrage, die über die Rallly API eine Datumsumfrage mit drei Optionen erstellt](/static/images/rallly-api/create-poll-editor.svg)

## Was sie kann

Die API deckt den gesamten Lebenszyklus einer Umfrage ab:

- **Eine Umfrage erstellen** – entweder mit ganzen Tagen oder Zeitfenstern. Zeitfenster können einzeln aufgelistet oder anhand eines Zeitplans erstellt werden, zum Beispiel alle 30 Minuten zwischen 9 und 17 Uhr an Wochentagen in den nächsten zwei Wochen.
- **Umfragen auflisten und auslesen**, gefiltert nach Status, mit denselben Optionen und Einstellungen, die du auch in der App siehst.
- **Ergebnisse auslesen**: die Anzahl der Stimmen pro Option und welche Optionen vorne liegen.
- **Teilnehmer auslesen** und sehen, wie jede Person abgestimmt hat.
- **Eine Umfrage schließen oder löschen**, sobald eine Entscheidung getroffen wurde.

Jede Anfrage ist auf eine Gruppe beschränkt. Der API-Schlüssel identifiziert die Gruppe, sodass alles, was du erstellst oder ausliest, zu dieser Gruppe gehört.

## Erste Schritte

Der Gruppeninhaber erstellt einen Schlüssel unter **Einstellungen → API-Schlüssel**. Anfragen übermitteln ihn als Bearer-Token:

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

Die Antwort enthält eine `inviteUrl`, die du mit Teilnehmern teilen kannst, sowie eine `adminUrl` für den Organisator. Jede Gruppe kann 60 Anfragen pro Minute stellen.

Die [API-Referenz](https://support.rallly.co/api-reference/introduction) enthält alle Endpunkte mit Beispielen für Anfragen und Antworten. Das OpenAPI-Dokument ist ebenfalls verfügbar, falls du lieber einen Client generieren möchtest.

## Wie es weitergeht

Das regelmäßige Abfragen von Ergebnissen funktioniert, aber die meisten Integrationen sollen nicht so betrieben werden. Webhooks für Umfrageereignisse sind geplant, damit dein System sofort von einer neuen Antwort oder einer geschlossenen Umfrage erfährt. Ein Datum dafür gibt es noch nicht. Wenn du etwas auf Basis der API entwickelst, würde ich gerne erfahren, woran du arbeitest und was dich dabei behindert – schreib mir an [feedback@rallly.co](mailto:feedback@rallly.co).
