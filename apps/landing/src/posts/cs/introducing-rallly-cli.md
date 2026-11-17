---
title: Představujeme CLI Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Nové CLI pro instalaci, konfiguraci a správu vlastních instancí Rallly, s
  HTTPS a nahráváním obrázků, které fungují okamžitě po instalaci.
---

Dříve vlastní provoz Rallly zahrnoval zkopírování ukázkového souboru `docker-compose.yml`, jeho ruční úpravu, výběr vlastního reverzního proxy serveru a nastavení bucketu S3, pokud jste chtěli, aby fungovalo nahrávání obrázků. Bylo to použitelné, ale každá instalace se trochu lišila a otázka „nastavil jsem to správně?“ se v e-mailech podpoře objevovala opakovaně.

Proto jsme vytvořili skutečné CLI, které za vás řeší instalaci, konfiguraci i každodenní správu.

## Instalace jedním příkazem

```sh
curl -fsSL https://get.rallly.co | bash
```

Instalační program zkontroluje vaše prostředí, provede vás konfigurací (doména, e-mail podpory, SMTP), vygeneruje za vás tajné klíče a vše spustí. Nic nemusíte upravovat ručně.

Funkční instance nyní obsahuje:

- samotné **Rallly**
- **PostgreSQL** pro databázi
- **Traefik** jako reverzní proxy server s automatickými certifikáty Let's Encrypt
- **Garage** pro objektové úložiště kompatibilní se S3, takže nahrávání avatarů a obrázků funguje okamžitě

Abyste získali kompletní instanci, už nemusíte zajišťovat vlastní proxy server ani objektové úložiště. Pokud ale raději používáte externí služby (spravovaný Postgres, AWS S3, vlastní Nginx nebo Caddy), můžete tak učinit: nastavte příslušné proměnné v `.env` a přibalené kontejnery pro tyto služby se jednoduše nespustí.

## Správa pomocí CLI

Po instalaci vše probíhá přes CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Aktualizace jsou nyní obzvlášť snadné a vyžadují jen jeden příkaz. `./rallly.sh update` stáhne nejnovější obrazy, znovu vytvoří kontejnery a zachová vaše data i konfiguraci. CLI ve výchozím nastavení sleduje tag `lukevella/rallly:4`, takže automaticky získáte kompatibilní vydání řady 4.x.

Díky větší kontrole nad celým stackem budeme v budoucnu moci přidávat další služby, aniž bychom komplikovali instalaci nebo vyžadovali, aby uživatelé upravovali své soubory Compose.

## Už vlastní Rallly provozujete?

Pokud už Rallly provozujete z ručně upraveného souboru `docker-compose.yml` nebo `config.env`, najdete podrobného [průvodce migrací](https://support.rallly.co/self-hosting/migration), který vás provede aktualizací na verzi 4.10 a přechodem na CLI bez ztráty dat. Nejdůležitější je přenést hodnotu `SECRET_PASSWORD`, která šifruje relace.

## Kde začít

- **Nová instalace**: [Průvodce instalací](https://support.rallly.co/self-hosting/installation/docker)
- **Každodenní správa**: [Průvodce správou](https://support.rallly.co/self-hosting/management)
- **Přecházíte ze staršího nastavení**: [Průvodce migrací](https://support.rallly.co/self-hosting/migration)

Cílem tohoto vydání bylo, aby vlastní provoz působil spíš jako hotový produkt než jako návod podle receptu. Pokud během používání na něco narazíte nebo máte nápady, co bychom měli přidat příště, budu rád, když se ozvete na [feedback@rallly.co](mailto:feedback@rallly.co).
