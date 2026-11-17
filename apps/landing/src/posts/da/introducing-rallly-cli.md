---
title: Vi introducerer Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Et nyt CLI-værktøj til installation, konfiguration og administration af
  selvhostede Rallly-instanser med HTTPS og billeduploads, der virker med det
  samme.
---

Selvhosting af Rallly krævede tidligere, at man kopierede en eksempel-`docker-compose.yml`, redigerede den manuelt, valgte sin egen reverseproxy og satte en S3-bucket op, hvis billeduploads skulle fungere. Det kunne lade sig gøre, men hver installation var lidt forskellig, og »har jeg konfigureret den del korrekt?« var et tilbagevendende spørgsmål i supportmails.

Derfor har vi bygget et ordentligt CLI-værktøj, der håndterer installation, konfiguration og den daglige drift for dig.

## Installér med én kommando

```sh
curl -fsSL https://get.rallly.co | bash
```

Installationsprogrammet tjekker dit miljø, guider dig gennem konfigurationen (domæne, supportmail og SMTP), genererer hemmeligheder for dig og starter det hele. Der er ikke noget, du skal redigere manuelt.

En fungerende instans indeholder nu:

- **Rallly** selv
- **PostgreSQL** til databasen
- **Traefik** som reverseproxy med automatiske Let's Encrypt-certifikater
- **Garage** til S3-kompatibel objektlagring, så avatarer og billeduploads virker med det samme

Du behøver ikke længere selv at medbringe en proxy eller objektlagring for at få en komplet instans. Hvis du hellere vil bruge eksterne tjenester (administreret Postgres, AWS S3, din egen Nginx eller Caddy), kan du gøre det: angiv de relevante variabler i `.env`, så starter de medfølgende containere til disse tjenester ganske enkelt ikke.

## Administrér med CLI-værktøjet

Når det er installeret, foregår alt via CLI-værktøjet `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Især opdateringer kan nu klares med én linje. `./rallly.sh update` henter de nyeste images, opretter containerne igen og bevarer dine data og din konfiguration. Som standard følger CLI-værktøjet tagget `lukevella/rallly:4`, så du får kompatible 4.x-udgivelser automatisk.

Ved at have mere kontrol over stakken kan vi desuden fremover gøre ting som at tilføje flere tjenester uden at gøre installationsprocessen mere kompliceret eller kræve, at brugerne redigerer deres compose-filer.

## Bruger du allerede selvhosting?

Hvis du allerede kører Rallly fra en manuelt redigeret `docker-compose.yml` eller `config.env`, gennemgår denne [migrationsguide](https://support.rallly.co/self-hosting/migration) trin for trin, hvordan du opgraderer til 4.10 og skifter til CLI-værktøjet uden at miste data. Det vigtigste, du skal have med over, er din `SECRET_PASSWORD`, som krypterer sessioner.

## Sådan kommer du i gang

- **Ny installation**: [Installationsguide](https://support.rallly.co/self-hosting/installation/docker)
- **Daglig drift**: [Administrationsguide](https://support.rallly.co/self-hosting/management)
- **Kommer du fra en ældre opsætning**: [Migrationsguide](https://support.rallly.co/self-hosting/migration)

Målet med denne udgivelse var at få selvhosting til at føles som et produkt i stedet for en opskrift. Hvis du støder på problemer undervejs eller har idéer til, hvad der bør komme som det næste, vil jeg meget gerne høre fra dig på [feedback@rallly.co](mailto:feedback@rallly.co).
