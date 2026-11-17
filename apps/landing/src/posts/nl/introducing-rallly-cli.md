---
title: De Rallly CLI introduceren
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Een nieuwe CLI voor het installeren, configureren en beheren van zelf gehoste
  Rallly-instanties, met HTTPS en uploads van afbeeldingen die direct werken.
---

Zelfhosting van Rallly hield voorheen in dat je een voorbeeldbestand `docker-compose.yml` kopieerde, het handmatig bewerkte, zelf een reverse proxy koos en een S3-bucket koppelde als je uploads van afbeeldingen wilde laten werken. Het werkte wel, maar elke installatie was net weer anders en de vraag "heb ik dat goed geconfigureerd?" kwam regelmatig terug in supportmails.

Daarom hebben we een volwaardige CLI gebouwd die de installatie, configuratie en dagelijkse werkzaamheden voor je afhandelt.

## Installeren met één opdracht

```sh
curl -fsSL https://get.rallly.co | bash
```

Het installatieprogramma controleert je omgeving, begeleidt je bij de configuratie (domein, support-e-mailadres, SMTP), genereert de benodigde geheimen voor je en start alles op. Je hoeft niets handmatig te bewerken.

Een werkende instantie bevat nu standaard:

- **Rallly** zelf
- **PostgreSQL** voor de database
- **Traefik** als reverse proxy met automatische Let's Encrypt-certificaten
- **Garage** voor S3-compatibele objectopslag, zodat uploads van avatars en afbeeldingen meteen werken

Je hoeft dus niet langer zelf een proxy of objectopslag mee te brengen voor een complete instantie. Gebruik je liever externe diensten (beheerde Postgres, AWS S3, je eigen Nginx of Caddy), dan kan dat ook: stel de relevante variabelen in `.env` in en de meegeleverde containers voor die diensten worden gewoon niet gestart.

## Beheren met de CLI

Na de installatie verloopt alles via de `rallly.sh` CLI:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Updates zijn nu helemaal eenvoudig. Met `./rallly.sh update` haal je de nieuwste images op, maak je de containers opnieuw aan en blijven je gegevens en configuratie behouden. Standaard volgt de CLI de tag `lukevella/rallly:4`, zodat je automatisch compatibele 4.x-releases ontvangt.

Doordat we bovendien meer controle hebben over de stack, kunnen we in de toekomst meer services toevoegen zonder het installatieproces ingewikkelder te maken of gebruikers te vragen hun composebestanden te bewerken.

## Gebruik je al zelfhosting?

Als je Rallly al gebruikt vanuit een handmatig bewerkt `docker-compose.yml`- of `config.env`-bestand, is er een stapsgewijze [migratiehandleiding](https://support.rallly.co/self-hosting/migration) die je begeleidt bij de upgrade naar 4.10 en de overstap naar de CLI, zonder gegevens te verliezen. Het belangrijkste om mee te nemen is je `SECRET_PASSWORD`, waarmee sessies worden versleuteld.

## Waar begin je?

- **Nieuwe installatie**: [Installatiehandleiding](https://support.rallly.co/self-hosting/installation/docker)
- **Dagelijks beheer**: [Beheerhandleiding](https://support.rallly.co/self-hosting/management)
- **Kom je van een oudere installatie?**: [Migratiehandleiding](https://support.rallly.co/self-hosting/migration)

Het doel van deze release was om zelfhosting meer als een product te laten aanvoelen dan als een recept. Loop je ergens tegenaan of heb je ideeën voor wat hierna moet komen, dan hoor ik graag van je via [feedback@rallly.co](mailto:feedback@rallly.co).
