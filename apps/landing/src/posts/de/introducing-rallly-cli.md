---
title: Die Rallly-CLI ist da
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Eine neue CLI zum Installieren, Konfigurieren und Verwalten selbst gehosteter
  Rallly-Instanzen – mit HTTPS und sofort einsatzbereiten Bild-Uploads.
---

Rallly selbst zu hosten bedeutete bisher, eine beispielhafte `docker-compose.yml` zu kopieren, sie von Hand zu bearbeiten, einen eigenen Reverse-Proxy auszuwählen und einen S3-Bucket einzurichten, wenn Bild-Uploads funktionieren sollten. Das war machbar, aber jede Installation war ein wenig anders, und die Frage „Habe ich diesen Teil richtig konfiguriert?“ tauchte in Support-E-Mails immer wieder auf.

Deshalb haben wir eine richtige CLI entwickelt, die Installation, Konfiguration und den täglichen Betrieb für dich übernimmt.

## Mit einem Befehl installieren

```sh
curl -fsSL https://get.rallly.co | bash
```

Das Installationsprogramm prüft deine Umgebung, führt dich durch die Konfiguration von Domain, Support-E-Mail und SMTP, generiert Geheimnisse für dich und startet alles. Du musst nichts von Hand bearbeiten.

Eine funktionierende Instanz umfasst jetzt:

- **Rallly** selbst
- **PostgreSQL** für die Datenbank
- **Traefik** als Reverse-Proxy mit automatischen Let's-Encrypt-Zertifikaten
- **Garage** für S3-kompatiblen Objektspeicher, sodass Avatar- und Bild-Uploads sofort funktionieren

Du brauchst jetzt keinen eigenen Proxy und keinen eigenen Objektspeicher mehr, um eine vollständige Instanz zu erhalten. Wenn du lieber externe Dienste verwenden möchtest, etwa verwaltetes Postgres, AWS S3, deinen eigenen Nginx oder Caddy, kannst du das tun: Setze die entsprechenden Variablen in `.env`, und die mitgelieferten Container für diese Dienste werden einfach nicht gestartet.

## Mit der CLI verwalten

Nach der Installation läuft alles über die `rallly.sh`-CLI:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Vor allem Updates sind jetzt mit einem einzigen Befehl erledigt. `./rallly.sh update` ruft die neuesten Images ab, erstellt die Container neu und behält deine Daten und Konfiguration bei. Standardmäßig verwendet die CLI das Tag `lukevella/rallly:4`, sodass du automatisch kompatible 4.x-Versionen erhältst.

Da wir außerdem mehr Kontrolle über den Stack haben, können wir in Zukunft weitere Dienste hinzufügen, ohne den Installationsprozess komplizierter zu machen oder Nutzer dazu zu zwingen, ihre Compose-Dateien zu bearbeiten.

## Du hostest Rallly bereits selbst?

Wenn du Rallly bereits mit einer von Hand bearbeiteten `docker-compose.yml` oder `config.env` betreibst, gibt es einen ausführlichen [Migrationsleitfaden](https://support.rallly.co/self-hosting/migration), der dich durch das Upgrade auf 4.10 und den Wechsel zur CLI führt, ohne dass Daten verloren gehen. Das Wichtigste, was du übernehmen musst, ist dein `SECRET_PASSWORD`, das Sitzungen verschlüsselt.

## So geht es weiter

- **Neue Installation**: [Installationsleitfaden](https://support.rallly.co/self-hosting/installation/docker)
- **Täglicher Betrieb**: [Verwaltungsleitfaden](https://support.rallly.co/self-hosting/management)
- **Du wechselst von einer älteren Einrichtung**: [Migrationsleitfaden](https://support.rallly.co/self-hosting/migration)

Mit dieser Version wollten wir Selbsthosting mehr wie ein Produkt und weniger wie ein Rezept gestalten. Wenn du unterwegs auf etwas stößt oder Ideen hast, was als Nächstes kommen sollte, freue ich mich über deine Nachricht an [feedback@rallly.co](mailto:feedback@rallly.co).
