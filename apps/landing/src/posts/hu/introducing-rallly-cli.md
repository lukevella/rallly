---
title: Bemutatjuk a Rallly CLI-t
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Új CLI a saját üzemeltetésű Rallly-példányok telepítéséhez, konfigurálásához
  és kezeléséhez, beépített HTTPS-támogatással és azonnal használható
  képfeltöltéssel.
---

A Rallly saját üzemeltetése korábban abból állt, hogy le kellett másolni egy példa `docker-compose.yml` fájlt, kézzel módosítani, kiválasztani egy saját reverse proxyt, és beállítani egy S3-tárolót, ha azt szeretted volna, hogy a képfeltöltés működjön. Működőképes megoldás volt, de minden telepítés egy kicsit másképp nézett ki, és a támogatási e-mailekben rendszeresen felmerült a kérdés: „vajon ezt a részt jól állítottam be?”

Ezért készítettünk egy teljes értékű CLI-t, amely elvégzi helyetted a telepítést, a konfigurálást és a mindennapi műveleteket.

## Telepítés egyetlen paranccsal

```sh
curl -fsSL https://get.rallly.co | bash
```

A telepítő ellenőrzi a környezetedet, végigvezet a konfiguráción (domain, támogatási e-mail-cím, SMTP), létrehozza helyetted a titkos kulcsokat, majd elindít mindent. Semmit sem kell kézzel szerkesztened.

Egy működő példány most a következőket tartalmazza:

- magát a **Rallly**-t
- **PostgreSQL** adatbázist
- **Traefik** reverse proxyt automatikus Let's Encrypt-tanúsítványokkal
- **Garage** S3-kompatibilis objektumtárolót, így az avatarok és képek feltöltése azonnal működik

Most már nem kell saját proxyt vagy objektumtárolót biztosítanod ahhoz, hogy teljes értékű példányod legyen. Ha inkább külső szolgáltatásokat használnál (menedzselt PostgreSQL-t, AWS S3-at, saját Nginxet vagy Caddyt), erre is van lehetőség: állítsd be a megfelelő változókat a `.env` fájlban, és az ezekhez a szolgáltatásokhoz tartozó csomagolt konténerek egyszerűen nem indulnak el.

## Kezelés a CLI-val

A telepítés után minden a `rallly.sh` CLI-n keresztül történik:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

A frissítések most különösen egyszerűek: egyetlen parancsra van szükség hozzájuk. A `./rallly.sh update` letölti a legújabb lemezképeket, újralétrehozza a konténereket, és megőrzi az adataidat, valamint a konfigurációdat. A CLI alapértelmezés szerint a `lukevella/rallly:4` taget követi, így automatikusan megkapod a kompatibilis 4.x-kiadásokat.

Emellett azzal, hogy nagyobb kontrollt szereztünk a stack felett, a jövőben újabb szolgáltatásokat is hozzáadhatunk anélkül, hogy bonyolultabbá tennénk a telepítést, vagy arra kényszerítenénk a felhasználókat, hogy módosítsák a compose-fájljaikat.

## Már saját magad üzemelteted?

Ha már egy kézzel szerkesztett `docker-compose.yml` vagy `config.env` fájlból futtatod a Rallly-t, egy lépésről lépésre követhető [migrálási útmutató](https://support.rallly.co/self-hosting/migration) végigvezet a 4.10-re történő frissítésen és a CLI-re való átálláson adatvesztés nélkül. A legfontosabb, amit át kell hoznod, a munkamenetek titkosítására szolgáló `SECRET_PASSWORD`.

## Hol érdemes kezdeni?

- **Új telepítés**: [Telepítési útmutató](https://support.rallly.co/self-hosting/installation/docker)
- **Mindennapi műveletek**: [Kezelési útmutató](https://support.rallly.co/self-hosting/management)
- **Régebbi beállításról érkezel**: [Migrálási útmutató](https://support.rallly.co/self-hosting/migration)

Ezzel a kiadással az volt a célunk, hogy a saját üzemeltetés inkább egy termék használatára, ne pedig egy recept követésére emlékeztessen. Ha útközben bármilyen problémába ütközöl, vagy ötleteid vannak arról, mi következzen, örömmel hallanánk rólad a [feedback@rallly.co](mailto:feedback@rallly.co) címen.
