---
title: Bemutatjuk a Rallly API-t
date: '2026-09-15'
category: Product
excerpt: >-
  Hozz létre szavazásokat, olvasd ki az eredményeket, és zárd le őket saját
  eszközeidből. Az API mostantól elérhető a Rallly Cloud Pro munkaterei számára.
---

A Rallly egy ideje már rendelkezik egy kapcsoló mögött rejtett, kis méretű API-val. Néhányan saját rendszereikből hoztak létre vele szavazásokat, és a visszajelzéseik hozzájárultak ahhoz, ami most elérhetővé vált. Mostantól a Rallly Cloud minden Pro munkatere számára megnyílt.

![Kódszerkesztő, amely egy három lehetőséget tartalmazó dátumszavazást létrehozó fetch-kérést jelenít meg a Rallly API-n keresztül](/static/images/rallly-api/create-poll-editor.svg)

## Mire használható?

Az API a szavazás teljes életciklusát lefedi:

- **Szavazás létrehozása** teljes napokkal vagy idősávokkal. Az idősávok egyenként is felsorolhatók, vagy ütemezés alapján is létrehozhatók, például hétköznapokon 9 és 17 óra között 30 percenként a következő két hétben.
- **Szavazások listázása és olvasása** állapot szerint szűrve, ugyanazokkal a lehetőségekkel és beállításokkal, amelyeket az alkalmazásban is látsz.
- **Eredmények olvasása**: lehetőségenkénti szavazatszámok és annak megállapítása, mely lehetőségek vezetnek.
- **Résztvevők adatainak olvasása**, valamint annak megtekintése, hogy ki hogyan szavazott.
- **Szavazás lezárása vagy törlése**, miután megszületett a döntés.

Minden kérés egyetlen munkatérhez tartozik. Az API-kulcs azonosítja a munkateret, így minden, amit létrehozol vagy kiolvasol, ahhoz tartozik.

## Első lépések

A munkatér tulajdonosa a **Beállítások → API-kulcsok** részen hozhat létre kulcsot. A kérések bearer tokenként továbbítják:

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

A válasz tartalmaz egy `inviteUrl` értéket, amelyet megoszthatsz a résztvevőkkel, valamint egy `adminUrl` értéket a szervező számára. Minden munkatér percenként 60 kérést indíthat.

Az [API-referencia](https://support.rallly.co/api-reference/introduction) minden végpontot bemutat kérés- és válaszpéldákkal együtt, az OpenAPI-dokumentum pedig akkor is elérhető, ha inkább klienst generálnál.

## Mi következik?

Az eredmények lekérdezése működik, de a legtöbb integráció nem így szeretne működni. Tervezzük a szavazások eseményeihez kapcsolódó webhookok bevezetését, hogy a rendszered azonnal értesüljön egy új válaszról vagy egy lezárt szavazásról. Ennek még nincs kitűzött időpontja. Ha építesz valamit az API-ra, szeretném hallani, min dolgozol, és mi akadályoz a munkában. Írj a [feedback@rallly.co](mailto:feedback@rallly.co) címre.
