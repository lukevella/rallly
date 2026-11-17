---
title: Przedstawiamy API Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Twórz ankiety, odczytuj wyniki i zamykaj je z poziomu własnych narzędzi. API
  jest już dostępne dla Przestrzeni Pro w Rallly Cloud.
---

Rallly od pewnego czasu ma niewielkie API ukryte za flagą. Kilka osób używało go do tworzenia ankiet z własnych systemów, a ich opinie wpłynęły na to, co dziś udostępniamy. API jest teraz dostępne dla każdej Przestrzeni Pro w Rallly Cloud.

![Edytor kodu pokazujący żądanie fetch, które tworzy ankietę dotyczącą terminów z trzema opcjami za pośrednictwem API Rallly](/static/images/rallly-api/create-poll-editor.svg)

## Co umożliwia

API obejmuje cały cykl życia ankiety:

- **Tworzenie ankiety** z całymi dniami lub przedziałami czasowymi. Przedziały czasowe można podać pojedynczo albo wygenerować na podstawie harmonogramu, na przykład co 30 minut między 9:00 a 17:00 w dni robocze przez najbliższe dwa tygodnie.
- **Wyświetlanie i odczytywanie ankiet** z filtrowaniem według statusu oraz tymi samymi opcjami i ustawieniami, które są dostępne w aplikacji.
- **Odczytywanie wyników**: liczby głosów dla poszczególnych opcji i informacje o tym, które opcje prowadzą.
- **Odczytywanie uczestników** oraz informacji o tym, jak każdy z nich zagłosował.
- **Zamykanie lub usuwanie** ankiety po podjęciu decyzji.

Każde żądanie dotyczy jednej Przestrzeni. Klucz API identyfikuje Przestrzeń, więc wszystko, co tworzysz lub odczytujesz, należy właśnie do niej.

## Pierwsze kroki

Właściciel Przestrzeni tworzy klucz w sekcji **Ustawienia → Klucze API**. Żądania przekazują go jako token bearer:

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

Odpowiedź zawiera `inviteUrl`, który możesz udostępnić uczestnikom, oraz `adminUrl` dla organizatora. Każda Przestrzeń może wykonać 60 żądań na minutę.

[Dokumentacja API](https://support.rallly.co/api-reference/introduction) zawiera informacje o każdym punkcie końcowym oraz przykłady żądań i odpowiedzi. Jeśli wolisz wygenerować klienta, możesz też skorzystać z dokumentu OpenAPI.

## Co dalej

Odpytywanie wyników działa, ale nie jest sposobem, w jaki większość integracji chce działać. Planujemy webhooki dla zdarzeń związanych z ankietami, aby Twój system otrzymywał informacje o nowej odpowiedzi lub zamkniętej ankiecie od razu, gdy takie zdarzenie nastąpi. Nie ma jeszcze ustalonej daty ich udostępnienia. Jeśli tworzysz coś z użyciem API, chętnie dowiem się, co budujesz i co utrudnia Ci pracę. Napisz na adres [feedback@rallly.co](mailto:feedback@rallly.co).
