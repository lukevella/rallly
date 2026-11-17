---
title: Presentiamo la CLI di Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Una nuova CLI per installare, configurare e gestire le istanze Rallly
  self-hosted, con HTTPS e caricamento delle immagini già funzionanti.
---

Prima, per usare Rallly in modalità self-hosted, era necessario copiare un file `docker-compose.yml` di esempio, modificarlo a mano, scegliere il proprio proxy inverso e configurare un bucket S3 se si voleva abilitare il caricamento delle immagini. Era possibile farlo, ma ogni installazione era un po' diversa e la domanda «ho configurato correttamente quella parte?» ricorreva spesso nelle email all'assistenza.

Per questo abbiamo creato una CLI completa che si occupa dell'installazione, della configurazione e delle operazioni quotidiane al posto tuo.

## Un comando per installare

```sh
curl -fsSL https://get.rallly.co | bash
```

Il programma di installazione controlla il tuo ambiente, ti guida nella configurazione (dominio, email per l'assistenza, SMTP), genera le chiavi segrete per te e avvia tutto. Non c'è nulla da modificare a mano.

Un'istanza funzionante ora include:

- **Rallly** stesso
- **PostgreSQL** per il database
- **Traefik** come proxy inverso, con certificati Let's Encrypt automatici
- **Garage** per lo storage di oggetti compatibile con S3, così il caricamento di avatar e immagini funziona immediatamente

Non devi più procurarti un proxy o uno storage di oggetti per avere un'istanza completa. Se preferisci usare servizi esterni (Postgres gestito, AWS S3, il tuo Nginx o Caddy), puoi farlo: imposta le variabili pertinenti in `.env` e i container inclusi per questi servizi semplicemente non verranno avviati.

## Gestisci tutto con la CLI

Dopo l'installazione, tutto passa dalla CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

In particolare, gli aggiornamenti ora richiedono una sola riga di comando. `./rallly.sh update` scarica le immagini più recenti, ricrea i container e conserva i tuoi dati e la tua configurazione. Per impostazione predefinita, la CLI usa il tag `lukevella/rallly:4`, quindi riceverai automaticamente le versioni compatibili della serie 4.x.

Inoltre, avendo un maggiore controllo sullo stack, in futuro potremo aggiungere altri servizi senza complicare il processo di installazione o chiedere agli utenti di modificare i propri file compose.

## Usi già Rallly in modalità self-hosted?

Se stai già eseguendo Rallly a partire da un file `docker-compose.yml` o `config.env` modificato a mano, è disponibile una [guida alla migrazione](https://support.rallly.co/self-hosting/migration) passo passo che ti accompagna nell'aggiornamento alla versione 4.10 e nel passaggio alla CLI senza perdere dati. La cosa più importante da trasferire è `SECRET_PASSWORD`, che cifra le sessioni.

## Da dove iniziare

- **Nuova installazione**: [Guida all'installazione](https://support.rallly.co/self-hosting/installation/docker)
- **Operazioni quotidiane**: [Guida alla gestione](https://support.rallly.co/self-hosting/management)
- **Se provieni da una configurazione precedente**: [Guida alla migrazione](https://support.rallly.co/self-hosting/migration)

Con questa versione volevamo fare in modo che usare Rallly in modalità self-hosted sembrasse un vero prodotto, anziché una semplice ricetta. Se incontri qualche difficoltà o hai idee su cosa dovremmo aggiungere in futuro, scrivici a [feedback@rallly.co](mailto:feedback@rallly.co).
