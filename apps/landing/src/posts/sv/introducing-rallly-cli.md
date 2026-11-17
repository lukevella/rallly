---
title: Vi presenterar Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Ett nytt CLI för att installera, konfigurera och hantera självhostade
  Rallly-instanser, med HTTPS och bilduppladdningar som fungerar direkt.
---

Att självhosta Rallly brukade innebära att kopiera en exempel-`docker-compose.yml`, redigera den för hand, välja en egen reverse proxy och konfigurera en S3-bucket om bilduppladdningar skulle fungera. Det gick att få till, men varje installation blev lite annorlunda, och frågan ”konfigurerade jag verkligen den där delen rätt?” återkom ofta i supportmejl.

Därför byggde vi ett riktigt CLI som hanterar installation, konfiguration och den dagliga driften åt dig.

## Installera med ett kommando

```sh
curl -fsSL https://get.rallly.co | bash
```

Installationsprogrammet kontrollerar din miljö, guidar dig genom konfigurationen (domän, supportmejl och SMTP), skapar hemliga nycklar åt dig och startar allt. Du behöver inte redigera någonting för hand.

En fungerande instans innehåller nu:

- **Rallly** självt
- **PostgreSQL** för databasen
- **Traefik** som reverse proxy med automatiska Let's Encrypt-certifikat
- **Garage** för S3-kompatibel objektlagring, så att avatarer och bilder kan laddas upp direkt

Du behöver inte längre ordna en egen proxy eller objektlagring för att få en komplett instans. Om du hellre vill använda externa tjänster (hanterad Postgres, AWS S3, din egen Nginx eller Caddy) går det också bra: ange de relevanta variablerna i `.env`, så startas de medföljande containrarna för dessa tjänster helt enkelt inte.

## Hantera allt med CLI:t

När Rallly väl är installerat går allt via CLI:t `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Särskilt uppdateringar görs nu med en enda rad. `./rallly.sh update` hämtar de senaste avbildningarna, återskapar containrarna och bevarar dina data och din konfiguration. Som standard följer CLI:t taggen `lukevella/rallly:4`, så du får automatiskt kompatibla 4.x-versioner.

Genom att vi dessutom har bättre kontroll över stacken kan vi framöver lägga till fler tjänster utan att göra installationsprocessen mer komplicerad eller kräva att användare redigerar sina compose-filer.

## Självhostar du redan?

Om du redan kör Rallly från en handredigerad `docker-compose.yml` eller `config.env` finns det en steg-för-steg-[migrationsguide](https://support.rallly.co/self-hosting/migration) som guidar dig genom uppgraderingen till 4.10 och övergången till CLI:t utan att du förlorar några data. Det viktigaste att ta med är ditt `SECRET_PASSWORD`, som krypterar sessioner.

## Så kommer du igång

- **Ny installation**: [Installationsguide](https://support.rallly.co/self-hosting/installation/docker)
- **Daglig drift**: [Hanteringsguide](https://support.rallly.co/self-hosting/management)
- **Kommer du från en äldre installation**: [Migrationsguide](https://support.rallly.co/self-hosting/migration)

Målet med den här versionen var att få självhostning att kännas som en produkt snarare än ett recept. Om du stöter på problem på vägen, eller har idéer om vad vi borde göra härnäst, får du gärna höra av dig på [feedback@rallly.co](mailto:feedback@rallly.co).
