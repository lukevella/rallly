---
title: Představujeme API Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Vytvářejte ankety, čtěte výsledky a uzavírejte je z vlastních nástrojů. API je
  nyní dostupné pro Pro Prostory v Rallly Cloud.
---

Rallly už nějakou dobu mělo malé API skryté za příznakem. Několik lidí ho používalo k vytváření anket z vlastních systémů a jejich zpětná vazba ovlivnila to, co dnes vydáváme. Nyní je dostupné pro všechny Pro Prostory v Rallly Cloud.

![Editor kódu zobrazující požadavek fetch, který prostřednictvím API Rallly vytváří anketu s termíny a třemi možnostmi](/static/images/rallly-api/create-poll-editor.svg)

## Co umí

API pokrývá celý životní cyklus ankety:

- **Vytvořit anketu** s celými dny nebo časovými úseky. Časové úseky lze zadat jednotlivě nebo je generovat podle rozvrhu, například každých 30 minut mezi 9. a 17. hodinou ve všední dny během následujících dvou týdnů.
- **Vypsat a načíst ankety**, filtrované podle stavu, se stejnými možnostmi a nastaveními, jaké vidíte v aplikaci.
- **Načíst výsledky**: počet hlasů pro jednotlivé možnosti a informace o tom, které možnosti vedou.
- **Načíst účastníky** a zjistit, jak každý z nich hlasoval.
- **Uzavřít nebo smazat** anketu, jakmile padne rozhodnutí.

Každý požadavek se týká jednoho Prostoru. Klíč API identifikuje Prostor, takže vše, co vytvoříte nebo načtete, k němu patří.

## Jak začít

Vlastník Prostoru vytvoří klíč v části **Nastavení → Klíče API**. Požadavky ho posílají jako nosný token:

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

Odpověď obsahuje `inviteUrl`, který můžete sdílet s účastníky, a `adminUrl` pro Organizátora. Každý Prostor může provést 60 požadavků za minutu.

[Referenční příručka API](https://support.rallly.co/api-reference/introduction) obsahuje všechny koncové body s příklady požadavků a odpovědí. Pokud byste si raději vygenerovali klienta, je k dispozici také dokument OpenAPI.

## Co bude dál

Průběžné dotazování na výsledky funguje, ale většina integrací takto pracovat nechce. Plánujeme webhooky pro události anket, aby se váš systém o nové Reakci nebo uzavřené anketě dozvěděl hned, jak k nim dojde. Zatím pro ně nemáme stanovené datum. Pokud na API něco vytvoříte, rád si poslechnu, na čem pracujete a co vám stojí v cestě, na adrese [feedback@rallly.co](mailto:feedback@rallly.co).
