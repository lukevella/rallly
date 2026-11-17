---
title: Vi introduserer Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  En ny CLI for installasjon, konfigurering og administrasjon av selvhostede
  Rallly-instanser, med HTTPS og bildeopplastinger som fungerer med én gang.
---

Tidligere innebar selvhosting av Rallly at du måtte kopiere en eksempel-fil kalt `docker-compose.yml`, redigere den manuelt, velge din egen reverse proxy og koble til en S3-bøtte hvis bildeopplastinger skulle fungere. Det var mulig å få til, men hver installasjon ble litt forskjellig, og «konfigurerte jeg den delen riktig?» var et tilbakevendende spørsmål i e-poster til brukerstøtten.

Derfor har vi laget en skikkelig CLI som håndterer installasjon, konfigurering og daglig drift for deg.

## Installer med én kommando

```sh
curl -fsSL https://get.rallly.co | bash
```

Installasjonsprogrammet sjekker miljøet ditt, veileder deg gjennom konfigureringen (domene, e-postadresse for brukerstøtte og SMTP), genererer hemmeligheter for deg og starter alt. Du trenger ikke redigere noe manuelt.

En fungerende instans inneholder nå:

- **Rallly**
- **PostgreSQL** for databasen
- **Traefik** som reverse proxy med automatiske Let's Encrypt-sertifikater
- **Garage** for S3-kompatibel objektlagring, slik at opplasting av avatarer og bilder fungerer med én gang

Du trenger ikke lenger å stille med egen proxy eller objektlagring for å få en komplett instans. Hvis du heller vil bruke eksterne tjenester (administrert Postgres, AWS S3, din egen Nginx eller Caddy), kan du gjøre det: Angi de relevante variablene i `.env`, så starter de medfølgende containerne for disse tjenestene ganske enkelt ikke.

## Administrer med CLI-en

Når alt er installert, går alt gjennom CLI-en `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Oppdateringer er spesielt enkle nå. `./rallly.sh update` henter de nyeste bildene, oppretter containerne på nytt og bevarer dataene og konfigureringen din. Som standard følger CLI-en taggen `lukevella/rallly:4`, så du får automatisk kompatible 4.x-utgivelser.

Ved at vi også har mer kontroll over oppsettet, kan vi i fremtiden gjøre ting som å legge til flere tjenester uten å gjøre installasjonen mer komplisert eller kreve at brukerne redigerer compose-filene sine.

## Kjører du allerede selvhosting?

Hvis du allerede kjører Rallly fra en manuelt redigert `docker-compose.yml` eller `config.env`, finnes det en trinnvis [migreringsveiledning](https://support.rallly.co/self-hosting/migration) som viser deg hvordan du oppgraderer til 4.10 og går over til CLI-en uten å miste data. Det viktigste du må ta med videre, er `SECRET_PASSWORD`, som krypterer økter.

## Slik kommer du i gang

- **Ny installasjon**: [Installasjonsveiledning](https://support.rallly.co/self-hosting/installation/docker)
- **Daglig drift**: [Administrasjonsveiledning](https://support.rallly.co/self-hosting/management)
- **Kommer du fra et eldre oppsett**: [Migreringsveiledning](https://support.rallly.co/self-hosting/migration)

Målet med denne utgivelsen var å få selvhosting til å føles som et produkt, ikke som en oppskrift. Hvis du støter på problemer underveis eller har ideer til hva som bør komme videre, hører jeg gjerne fra deg på [feedback@rallly.co](mailto:feedback@rallly.co).
